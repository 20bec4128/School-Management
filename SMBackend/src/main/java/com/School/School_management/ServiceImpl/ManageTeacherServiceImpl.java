package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.ManageTeacherDto;
import com.School.School_management.Entity.Designation;
import com.School.School_management.Entity.ManageTeacher;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Repository.DesignationRepository;
import com.School.School_management.Repository.TeacherRepository;
import com.School.School_management.Service.ManageTeacherService;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ManageTeacherServiceImpl implements ManageTeacherService {

    private final TeacherRepository teacherRepository;
    private final DesignationRepository designationRepository;
    private final Path teacherUploadDir;

    public ManageTeacherServiceImpl(
            TeacherRepository teacherRepository,
            DesignationRepository designationRepository,
            @Value("${app.upload.dir:uploads}") String uploadDir
    ) {
        this.teacherRepository = teacherRepository;
        this.designationRepository = designationRepository;
        this.teacherUploadDir = Paths.get(uploadDir, "teachers").toAbsolutePath().normalize();
    }

    @Override
    public ManageTeacherDto createTeacher(ManageTeacherDto dto, MultipartFile photo, MultipartFile resume) {
        ManageTeacher teacher = toEntity(dto);

        if (photo != null && !photo.isEmpty()) {
            teacher.setPhotoUrl(saveFile(photo));
        }

        if (resume != null && !resume.isEmpty()) {
            teacher.setResumeUrl(saveFile(resume));
        }

        return toDto(teacherRepository.save(teacher));
    }

    @Override
    public List<ManageTeacherDto> getAllTeachers() {
        return teacherRepository.findAll().stream()
                .sorted(Comparator.comparing(ManageTeacher::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toDto)
                .toList();
    }

    @Override
    public ManageTeacherDto getTeacherById(Long id) {
        return toDto(findTeacher(id));
    }

    @Override
    public ManageTeacherDto updateTeacher(Long id, ManageTeacherDto dto, MultipartFile photo, MultipartFile resume) {
        ManageTeacher teacher = findTeacher(id);

        teacher.setName(dto.getName());
        teacher.setNationalId(dto.getNationalId());
        teacher.setDepartment(dto.getDepartment());
        teacher.setPhone(dto.getPhone());
        teacher.setGender(dto.getGender());
        teacher.setBloodGroup(dto.getBloodGroup());
        teacher.setReligion(dto.getReligion());
        teacher.setBirthDate(dto.getBirthDate());
        teacher.setPresentAddress(dto.getPresentAddress());
        teacher.setPermanentAddress(dto.getPermanentAddress());
        teacher.setEmail(dto.getEmail());
        teacher.setUsername(dto.getUsername());
        teacher.setPassword(dto.getPassword());
        teacher.setSalaryGrade(dto.getSalaryGrade());
        teacher.setSalaryType(dto.getSalaryType());
        if (dto.getSchoolId() != null) {
            teacher.setSchoolId(dto.getSchoolId());
        }
        applyDesignation(dto, teacher);
        teacher.setRole(dto.getRole());
        teacher.setJoiningDate(dto.getJoiningDate());
        teacher.setIsViewOnWeb(dto.getIsViewOnWeb());
        teacher.setFacebookUrl(dto.getFacebookUrl());
        teacher.setLinkedinUrl(dto.getLinkedinUrl());
        teacher.setTwitterUrl(dto.getTwitterUrl());
        teacher.setInstagramUrl(dto.getInstagramUrl());
        teacher.setYoutubeUrl(dto.getYoutubeUrl());
        teacher.setPinterestUrl(dto.getPinterestUrl());
        teacher.setOtherInfo(dto.getOtherInfo());
        teacher.setDisplayOrder(dto.getDisplayOrder());

        if (photo != null && !photo.isEmpty()) {
            teacher.setPhotoUrl(saveFile(photo));
        }

        if (resume != null && !resume.isEmpty()) {
            teacher.setResumeUrl(saveFile(resume));
        }

        return toDto(teacherRepository.save(teacher));
    }

    @Override
    public void deleteTeacher(Long id) {
        if (!teacherRepository.existsById(id)) {
            throw new RuntimeException("Teacher not found");
        }

        teacherRepository.deleteById(id);
    }

    private ManageTeacher findTeacher(Long id) {
        return teacherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
    }

    private String saveFile(MultipartFile file) {
        try {
            Files.createDirectories(teacherUploadDir);
            String originalName = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
            String sanitizedName = Paths.get(originalName).getFileName().toString().replaceAll("[^a-zA-Z0-9._-]", "_");
            String fileName = UUID.randomUUID() + "_" + sanitizedName;
            Path targetPath = teacherUploadDir.resolve(fileName).normalize();
            file.transferTo(targetPath.toFile());
            return "/uploads/teachers/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("File upload failed: " + e.getMessage(), e);
        }
    }

    private ManageTeacher toEntity(ManageTeacherDto dto) {
        ManageTeacher teacher = new ManageTeacher();
        teacher.setId(dto.getId());
        teacher.setName(dto.getName());
        teacher.setNationalId(dto.getNationalId());
        teacher.setDepartment(dto.getDepartment());
        teacher.setPhone(dto.getPhone());
        teacher.setGender(dto.getGender());
        teacher.setBloodGroup(dto.getBloodGroup());
        teacher.setReligion(dto.getReligion());
        teacher.setBirthDate(dto.getBirthDate());
        teacher.setPresentAddress(dto.getPresentAddress());
        teacher.setPermanentAddress(dto.getPermanentAddress());
        teacher.setEmail(dto.getEmail());
        teacher.setUsername(dto.getUsername());
        teacher.setPassword(dto.getPassword());
        teacher.setSalaryGrade(dto.getSalaryGrade());
        teacher.setSalaryType(dto.getSalaryType());
        if (dto.getSchoolId() != null) {
            teacher.setSchoolId(dto.getSchoolId());
        }
        applyDesignation(dto, teacher);
        teacher.setRole(dto.getRole());
        teacher.setJoiningDate(dto.getJoiningDate());
        teacher.setIsViewOnWeb(dto.getIsViewOnWeb());
        teacher.setFacebookUrl(dto.getFacebookUrl());
        teacher.setLinkedinUrl(dto.getLinkedinUrl());
        teacher.setTwitterUrl(dto.getTwitterUrl());
        teacher.setInstagramUrl(dto.getInstagramUrl());
        teacher.setYoutubeUrl(dto.getYoutubeUrl());
        teacher.setPinterestUrl(dto.getPinterestUrl());
        teacher.setOtherInfo(dto.getOtherInfo());
        teacher.setPhotoUrl(dto.getPhotoUrl());
        teacher.setResumeUrl(dto.getResumeUrl());
        teacher.setDisplayOrder(dto.getDisplayOrder());
        return teacher;
    }

    private ManageTeacherDto toDto(ManageTeacher teacher) {
        ManageTeacherDto dto = new ManageTeacherDto();
        dto.setId(teacher.getId());
        dto.setSchoolId(teacher.getSchoolId());
        dto.setName(teacher.getName());
        dto.setNationalId(teacher.getNationalId());
        dto.setDepartment(teacher.getDepartment());
        dto.setPhone(teacher.getPhone());
        dto.setGender(teacher.getGender());
        dto.setBloodGroup(teacher.getBloodGroup());
        dto.setReligion(teacher.getReligion());
        dto.setBirthDate(teacher.getBirthDate());
        dto.setPresentAddress(teacher.getPresentAddress());
        dto.setPermanentAddress(teacher.getPermanentAddress());
        dto.setEmail(teacher.getEmail());
        dto.setUsername(teacher.getUsername());
        dto.setPassword(teacher.getPassword());
        dto.setSalaryGrade(teacher.getSalaryGrade());
        dto.setSalaryType(teacher.getSalaryType());
        dto.setDesignationId(teacher.getDesignationId());
        dto.setDesignationName(teacher.getDesignationName());
        dto.setRole(teacher.getRole());
        dto.setJoiningDate(teacher.getJoiningDate());
        dto.setIsViewOnWeb(teacher.getIsViewOnWeb());
        dto.setFacebookUrl(teacher.getFacebookUrl());
        dto.setLinkedinUrl(teacher.getLinkedinUrl());
        dto.setTwitterUrl(teacher.getTwitterUrl());
        dto.setInstagramUrl(teacher.getInstagramUrl());
        dto.setYoutubeUrl(teacher.getYoutubeUrl());
        dto.setPinterestUrl(teacher.getPinterestUrl());
        dto.setOtherInfo(teacher.getOtherInfo());
        dto.setPhotoUrl(teacher.getPhotoUrl());
        dto.setResumeUrl(teacher.getResumeUrl());
        dto.setDisplayOrder(teacher.getDisplayOrder());
        return dto;
    }

    private void applyDesignation(ManageTeacherDto dto, ManageTeacher teacher) {
        if (dto == null) throw new BadRequestException("Teacher payload is required");

        Long designationId = dto.getDesignationId();
        if (designationId == null) {
            throw new BadRequestException("designationId is required");
        }

        Long schoolId = dto.getSchoolId() != null ? dto.getSchoolId() : teacher.getSchoolId();
        if (schoolId == null) {
            throw new BadRequestException("schoolId is required");
        }

        Designation designation = designationRepository.findById(designationId)
                .orElseThrow(() -> new BadRequestException("Invalid designationId"));

        if (designation.getSchoolId() == null || !designation.getSchoolId().equals(schoolId)) {
            throw new BadRequestException("designationId does not belong to the selected school");
        }

        String role = designation.getRole() == null ? "" : designation.getRole().trim();
        if (!role.equalsIgnoreCase("TEACHER")) {
            throw new BadRequestException("designationId must be a TEACHER designation");
        }

        teacher.setDesignationId(designation.getId());
        teacher.setDesignationName(designation.getName());
    }
}
