package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.EmployeeDto;
import com.School.School_management.Entity.Employee;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.EmployeeRepository;
import com.School.School_management.Repository.DesignationRepository;
import com.School.School_management.Repository.SalaryGradeRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.EmployeeService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.config.UploadProperties;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DesignationRepository designationRepository;
    private final SalaryGradeRepository salaryGradeRepository;
    private final SchoolRepository schoolRepository;
    private final PasswordEncoder passwordEncoder;
    private final Path employeeUploadDir;

    public EmployeeServiceImpl(
            EmployeeRepository employeeRepository,
            DesignationRepository designationRepository,
            SalaryGradeRepository salaryGradeRepository,
            SchoolRepository schoolRepository,
            PasswordEncoder passwordEncoder,
            UploadProperties uploadProperties
    ) {
        this.employeeRepository = employeeRepository;
        this.designationRepository = designationRepository;
        this.salaryGradeRepository = salaryGradeRepository;
        this.schoolRepository = schoolRepository;
        this.passwordEncoder = passwordEncoder;
        this.employeeUploadDir = Paths.get(uploadProperties.getDir(), "employees").toAbsolutePath().normalize();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmployeeDto> list(Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        // SUPER_ADMIN can list all if schoolId not provided.
        if (user.isSuperAdmin() && schoolId == null) {
            return employeeRepository.findAllByOrderByIdDesc()
                    .stream().map(this::toDto).collect(Collectors.toList());
        }

        Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
        return employeeRepository.findBySchoolIdOrderByIdDesc(effectiveSchoolId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EmployeeDto> listPaginated(Long schoolId, int page, int size, String search) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedSearch = (search == null || search.trim().isEmpty()) ? null : search.trim();

        if (user.isSuperAdmin() && schoolId == null) {
            List<EmployeeDto> rows = employeeRepository.findAllByOrderByIdDesc()
                    .stream()
                    .map(this::toDto)
                    .filter(dto -> {
                        if (normalizedSearch == null) return true;
                        String haystack = String.join(" ",
                                safe(dto.getName()),
                                safe(dto.getEmail()),
                                safe(dto.getPhone()),
                                safe(dto.getUsername()),
                                safe(dto.getRole()))
                                .toLowerCase();
                        return haystack.contains(normalizedSearch.toLowerCase());
                    })
                    .toList();
            return slice(rows, pageable);
        }

        Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
        return employeeRepository.searchEmployees(effectiveSchoolId, normalizedSearch, pageable)
                .map(this::toDto);
    }

    @Override
    public EmployeeDto create(EmployeeDto dto, MultipartFile photo, MultipartFile resume) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto == null ? null : dto.getSchoolId());
        validateSalaryGradeForSchool(effectiveSchoolId, dto == null ? null : dto.getSalaryGrade());

        Employee e = new Employee();
        applyDto(e, dto);
        e.setSchoolId(effectiveSchoolId);

        if (photo != null && !photo.isEmpty()) {
            e.setPhotoUrl(saveFile(photo));
        }
        if (resume != null && !resume.isEmpty()) {
            e.setResumeUrl(saveFile(resume));
        }

        // Store password securely if provided (even if you don’t use employee login yet).
        if (dto != null && dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            e.setPasswordHash(passwordEncoder.encode(dto.getPassword().trim()));
        }

        return toDto(employeeRepository.save(e));
    }

    @Override
    public EmployeeDto update(Long id, EmployeeDto dto, MultipartFile photo, MultipartFile resume) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Employee existing = employeeRepository.findById(id).orElseThrow(NotFoundException::new);

        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto == null ? null : dto.getSchoolId());
        validateSalaryGradeForSchool(effectiveSchoolId, dto == null ? null : dto.getSalaryGrade());

        // Prevent cross-school update unless SUPER_ADMIN
        if (!user.isSuperAdmin() && !Objects.equals(existing.getSchoolId(), effectiveSchoolId)) {
            throw new ForbiddenException();
        }

        applyDto(existing, dto);
        existing.setSchoolId(effectiveSchoolId);

        if (photo != null && !photo.isEmpty()) {
            existing.setPhotoUrl(saveFile(photo));
        }
        if (resume != null && !resume.isEmpty()) {
            existing.setResumeUrl(saveFile(resume));
        }

        if (dto != null && dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            existing.setPasswordHash(passwordEncoder.encode(dto.getPassword().trim()));
        }

        return toDto(employeeRepository.save(existing));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Employee existing = employeeRepository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, existing.getSchoolId());

        if (!user.isSuperAdmin() && !Objects.equals(existing.getSchoolId(), effectiveSchoolId)) {
            throw new ForbiddenException();
        }

        employeeRepository.delete(existing);
    }

    private Long effectiveSchoolIdForRead(CurrentUser user, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return user.schoolId();
        }

        if (user.isHeadOfficeScopedAdmin()) {
            if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
            ensureSchoolInHeadOffice(requestedSchoolId, user.headOfficeId());
            return requestedSchoolId;
        }

        if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
        return requestedSchoolId;
    }

    private Long effectiveSchoolIdForWrite(CurrentUser user, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return user.schoolId();
        }

        if (user.isHeadOfficeScopedAdmin()) {
            if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
            ensureSchoolInHeadOffice(requestedSchoolId, user.headOfficeId());
            return requestedSchoolId;
        }

        if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
        return requestedSchoolId;
    }

    private void ensureSchoolInHeadOffice(Long schoolId, Long headOfficeId) {
        boolean ok = schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isPresent();
        if (!ok) throw new NotFoundException();
    }

    private void applyDto(Employee e, EmployeeDto dto) {
        if (dto == null) return;

        e.setDesignationId(dto.getDesignationId());
        e.setRole(trim(dto.getRole()));
        e.setName(required(dto.getName(), "Name is required"));
        e.setNationalId(trim(dto.getNationalId()));
        e.setPhone(trim(dto.getPhone()));
        e.setGender(trim(dto.getGender()));
        e.setBloodGroup(trim(dto.getBloodGroup()));
        e.setReligion(trim(dto.getReligion()));
        e.setBirthDate(dto.getBirthDate());

        e.setPresentAddress(trim(dto.getPresentAddress()));
        e.setPermanentAddress(trim(dto.getPermanentAddress()));

        e.setEmail(trim(dto.getEmail()));
        e.setUsername(trim(dto.getUsername()));
        e.setSalaryGrade(trim(dto.getSalaryGrade()));
        e.setSalaryType(trim(dto.getSalaryType()));
        e.setJoiningDate(dto.getJoiningDate());

        e.setIsViewOnWeb(trim(dto.getIsViewOnWeb()));

        e.setFacebookUrl(trim(dto.getFacebookUrl()));
        e.setLinkedinUrl(trim(dto.getLinkedinUrl()));
        e.setTwitterUrl(trim(dto.getTwitterUrl()));
        e.setInstagramUrl(trim(dto.getInstagramUrl()));
        e.setYoutubeUrl(trim(dto.getYoutubeUrl()));
        e.setPinterestUrl(trim(dto.getPinterestUrl()));
        e.setOtherInfo(trim(dto.getOtherInfo()));
    }

    private EmployeeDto toDto(Employee e) {
        EmployeeDto dto = new EmployeeDto();
        dto.setId(e.getId());
        dto.setSchoolId(e.getSchoolId());
        dto.setDesignationId(e.getDesignationId());
        dto.setDesignationName(resolveDesignationName(e.getDesignationId()));
        dto.setRole(e.getRole());

        dto.setName(e.getName());
        dto.setNationalId(e.getNationalId());
        dto.setPhone(e.getPhone());
        dto.setGender(e.getGender());
        dto.setBloodGroup(e.getBloodGroup());
        dto.setReligion(e.getReligion());
        dto.setBirthDate(e.getBirthDate());
        dto.setPresentAddress(e.getPresentAddress());
        dto.setPermanentAddress(e.getPermanentAddress());

        dto.setEmail(e.getEmail());
        dto.setUsername(e.getUsername());
        dto.setSalaryGrade(e.getSalaryGrade());
        dto.setSalaryType(e.getSalaryType());
        dto.setJoiningDate(e.getJoiningDate());

        dto.setIsViewOnWeb(e.getIsViewOnWeb());
        dto.setFacebookUrl(e.getFacebookUrl());
        dto.setLinkedinUrl(e.getLinkedinUrl());
        dto.setTwitterUrl(e.getTwitterUrl());
        dto.setInstagramUrl(e.getInstagramUrl());
        dto.setYoutubeUrl(e.getYoutubeUrl());
        dto.setPinterestUrl(e.getPinterestUrl());
        dto.setOtherInfo(e.getOtherInfo());

        dto.setPhotoUrl(e.getPhotoUrl());
        dto.setResumeUrl(e.getResumeUrl());

        // Do NOT return password hash
        dto.setPassword(null);

        return dto;
    }

    private String saveFile(MultipartFile file) {
        try {
            Files.createDirectories(employeeUploadDir);
            String originalName = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
            String sanitizedName = Paths.get(originalName).getFileName().toString().replaceAll("[^a-zA-Z0-9._-]", "_");
            String fileName = UUID.randomUUID() + "_" + sanitizedName;

            Path targetPath = employeeUploadDir.resolve(fileName).normalize();
            file.transferTo(targetPath.toFile());

            return "/uploads/employees/" + fileName;
        } catch (IOException ex) {
            throw new RuntimeException("File upload failed: " + ex.getMessage(), ex);
        }
    }

    private String trim(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }

    private String required(String v, String msg) {
        String t = trim(v);
        if (t == null) throw new BadRequestException(msg);
        return t;
    }

    private void validateSalaryGradeForSchool(Long schoolId, String salaryGrade) {
        String normalized = trim(salaryGrade);
        if (normalized == null) return;

        boolean exists = salaryGradeRepository.existsBySchoolIdAndGradeNameIgnoreCase(schoolId, normalized);
        if (!exists) {
            throw new BadRequestException("Invalid salary grade for the selected school");
        }
    }

    private Page<EmployeeDto> slice(List<EmployeeDto> rows, Pageable pageable) {
        int start = Math.min(pageable.getPageNumber() * pageable.getPageSize(), rows.size());
        int end = Math.min(start + pageable.getPageSize(), rows.size());
        return new PageImpl<>(rows.subList(start, end), pageable, rows.size());
    }

    private String safe(String v) {
        return v == null ? "" : v;
    }

    private String resolveDesignationName(Long designationId) {
        if (designationId == null) return null;
        return designationRepository.findById(designationId)
                .map(designation -> designation.getName())
                .orElse(null);
    }
}
