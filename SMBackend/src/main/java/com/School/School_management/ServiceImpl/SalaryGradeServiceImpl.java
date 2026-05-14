package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.SalaryGradeDto;
import com.School.School_management.Entity.SalaryGrade;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ConflictException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.SalaryGradeRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.SalaryGradeService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SalaryGradeServiceImpl implements SalaryGradeService {

    private final SalaryGradeRepository salaryGradeRepository;
    private final SchoolRepository schoolRepository;

    public SalaryGradeServiceImpl(SalaryGradeRepository salaryGradeRepository, SchoolRepository schoolRepository) {
        this.salaryGradeRepository = salaryGradeRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalaryGradeDto> list(Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        if (user.isSuperAdmin() && schoolId == null) {
            return salaryGradeRepository.findAllByOrderByIdDesc()
                    .stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());
        }

        Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
        return salaryGradeRepository.findBySchoolIdOrderByIdDesc(effectiveSchoolId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SalaryGradeDto> listPaginated(Long schoolId, int page, int size, String search) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedSearch = (search == null || search.trim().isEmpty()) ? null : search.trim();

        if (user.isSuperAdmin() && schoolId == null) {
            List<SalaryGradeDto> rows = salaryGradeRepository.findAllByOrderByIdDesc()
                    .stream()
                    .map(this::toDto)
                    .filter(dto -> {
                        if (normalizedSearch == null) return true;
                        String haystack = String.join(" ",
                                safe(dto.getSchoolName()),
                                safe(dto.getGradeName()),
                                safe(dto.getNote()))
                                .toLowerCase();
                        return haystack.contains(normalizedSearch.toLowerCase());
                    })
                    .toList();
            return slice(rows, pageable);
        }

        Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
        return salaryGradeRepository.searchSalaryGrades(effectiveSchoolId, normalizedSearch, pageable)
                .map(this::toDto);
    }

    @Override
    public SalaryGradeDto create(SalaryGradeDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto == null ? null : dto.getSchoolId());
        String gradeName = normalizeRequired(dto == null ? null : dto.getGradeName(), "Grade name is required");

        if (salaryGradeRepository.existsBySchoolIdAndGradeNameIgnoreCase(effectiveSchoolId, gradeName)) {
            throw new ConflictException("Salary Grade already exists for this school");
        }

        SalaryGrade entity = new SalaryGrade();
        updateEntityFromDto(entity, dto);
        entity.setSchoolId(effectiveSchoolId);
        
        return toDto(salaryGradeRepository.save(entity));
    }

    @Override
    public SalaryGradeDto update(Long id, SalaryGradeDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        SalaryGrade entity = salaryGradeRepository.findById(id).orElseThrow(NotFoundException::new);

        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto == null ? null : dto.getSchoolId());
        if (!Objects.equals(entity.getSchoolId(), effectiveSchoolId) && !user.isSuperAdmin()) {
            throw new ForbiddenException();
        }

        String gradeName = normalizeRequired(dto == null ? null : dto.getGradeName(), "Grade name is required");
        if (salaryGradeRepository.existsBySchoolIdAndGradeNameIgnoreCaseAndIdNot(effectiveSchoolId, gradeName, id)) {
            throw new ConflictException("Salary Grade already exists for this school");
        }

        updateEntityFromDto(entity, dto);
        entity.setSchoolId(effectiveSchoolId);
        
        return toDto(salaryGradeRepository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        SalaryGrade entity = salaryGradeRepository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, entity.getSchoolId());
        if (!Objects.equals(entity.getSchoolId(), effectiveSchoolId) && !user.isSuperAdmin()) {
            throw new ForbiddenException();
        }
        salaryGradeRepository.delete(entity);
    }

    private void updateEntityFromDto(SalaryGrade entity, SalaryGradeDto dto) {
        entity.setGradeName(dto.getGradeName());
        entity.setBasicSalary(dto.getBasicSalary());
        entity.setHouseRent(dto.getHouseRent());
        entity.setTransportAllowance(dto.getTransportAllowance());
        entity.setMedicalAllowance(dto.getMedicalAllowance());
        entity.setOverTimeHourlyRate(dto.getOverTimeHourlyRate());
        entity.setProvidentFund(dto.getProvidentFund());
        entity.setHourlyRate(dto.getHourlyRate());
        entity.setTotalAllowance(dto.getTotalAllowance());
        entity.setTotalDeduction(dto.getTotalDeduction());
        entity.setGrossSalary(dto.getGrossSalary());
        entity.setNetSalary(dto.getNetSalary());
        entity.setNote(normalizeOptional(dto.getNote()));
    }

    private Long effectiveSchoolIdForRead(CurrentUser user, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return user.schoolId();
        }

        if (user.isHeadOfficeScopedAdmin()) {
            if (requestedSchoolId == null) {
                throw new BadRequestException("schoolId is required");
            }
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

    private SalaryGradeDto toDto(SalaryGrade entity) {
        SalaryGradeDto dto = new SalaryGradeDto();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setSchoolName(resolveSchoolName(entity.getSchoolId()));
        dto.setGradeName(entity.getGradeName());
        dto.setBasicSalary(entity.getBasicSalary());
        dto.setHouseRent(entity.getHouseRent());
        dto.setTransportAllowance(entity.getTransportAllowance());
        dto.setMedicalAllowance(entity.getMedicalAllowance());
        dto.setOverTimeHourlyRate(entity.getOverTimeHourlyRate());
        dto.setProvidentFund(entity.getProvidentFund());
        dto.setHourlyRate(entity.getHourlyRate());
        dto.setTotalAllowance(entity.getTotalAllowance());
        dto.setTotalDeduction(entity.getTotalDeduction());
        dto.setGrossSalary(entity.getGrossSalary());
        dto.setNetSalary(entity.getNetSalary());
        dto.setNote(entity.getNote());
        return dto;
    }

    private String resolveSchoolName(Long schoolId) {
        if (schoolId == null) return null;
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .map(ManageSchool::getSchoolName)
                .orElse(null);
    }

    private String normalizeRequired(String value, String message) {
        if (value == null) throw new BadRequestException(message);
        String trimmed = value.trim();
        if (trimmed.isEmpty()) throw new BadRequestException(message);
        return trimmed;
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Page<SalaryGradeDto> slice(List<SalaryGradeDto> rows, Pageable pageable) {
        int start = Math.min(pageable.getPageNumber() * pageable.getPageSize(), rows.size());
        int end = Math.min(start + pageable.getPageSize(), rows.size());
        return new PageImpl<>(rows.subList(start, end), pageable, rows.size());
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
