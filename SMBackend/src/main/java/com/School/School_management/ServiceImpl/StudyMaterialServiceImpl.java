// ServiceImpl/StudyMaterialServiceImpl.java
package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.StudyMaterialRequestDto;
import com.School.School_management.Dto.StudyMaterialResponseDto;
import com.School.School_management.Entity.StudyMaterial;
import com.School.School_management.Entity.Student;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.ParentStudentRepository;
import com.School.School_management.Repository.StudentRepository;
import com.School.School_management.Repository.SubjectRepository;
import com.School.School_management.Repository.StudyMaterialRepository;
import com.School.School_management.Service.StudyMaterialService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.config.UploadProperties;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.List;

@Service
public class StudyMaterialServiceImpl implements StudyMaterialService {

    private final StudyMaterialRepository repository;
    private final SubjectRepository subjectRepository;
    private final StudentRepository studentRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final UploadProperties uploadProperties;

    public StudyMaterialServiceImpl(
            StudyMaterialRepository repository,
            SubjectRepository subjectRepository,
            StudentRepository studentRepository,
            ParentStudentRepository parentStudentRepository,
            UploadProperties uploadProperties
    ) {
        this.repository = repository;
        this.subjectRepository = subjectRepository;
        this.studentRepository = studentRepository;
        this.parentStudentRepository = parentStudentRepository;
        this.uploadProperties = uploadProperties;
    }

    @Override
    public StudyMaterialResponseDto create(StudyMaterialRequestDto dto, MultipartFile material) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (user.isSchoolScoped()) dto.setSchoolId(user.schoolId());
        if (user.isRole("TEACHER")) ensureTeacherOwnsSubject(user.teacherId(), dto.getSubjectId());

        StudyMaterial sm = new StudyMaterial();
        copyDto(sm, dto);
        saveFile(sm, material);
        return map(repository.save(sm));
    }

    @Override
    public List<StudyMaterialResponseDto> getAll(Long schoolId, Long classId, Long subjectId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        List<StudyMaterial> list;
        if (user.isSuperAdmin()) {
            list = repository.findAll();
        } else if (user.adminId() != null) {
            if (user.schoolId() == null) list = repository.findAll();
            else list = repository.findBySchoolId(user.schoolId());
        } else if (user.isRole("TEACHER")) {
            List<Long> subjectIds = subjectRepository.findByTeacher_Id(user.teacherId()).stream().map(s -> s.getId()).toList();
            if (subjectIds.isEmpty()) list = List.of();
            else list = repository.findBySubjectIdIn(subjectIds);
        } else if (user.isRole("STUDENT")) {
            Student s = studentRepository.findById(user.studentId()).orElseThrow(NotFoundException::new);
            Long studentSchoolId = s.getSchool() == null ? null : s.getSchool().getId();
            if (studentSchoolId == null || s.getSchoolClass() == null) list = List.of();
            else list = repository.findBySchoolIdAndClassId(studentSchoolId, s.getSchoolClass().getId());
        } else if (user.isRole("PARENT")) {
            List<Long> childIds = parentStudentRepository.findStudentIdsByParentId(user.parentId());
            Optional<Student> first = childIds.stream().map(studentRepository::findById).flatMap(Optional::stream).findFirst();
            if (first.isEmpty() || first.get().getSchool() == null || first.get().getSchoolClass() == null) {
                list = List.of();
            } else {
                list = repository.findBySchoolIdAndClassId(first.get().getSchool().getId(), first.get().getSchoolClass().getId());
            }
        } else {
            list = List.of();
        }

        return list.stream()
                .filter(item -> schoolId == null || schoolId.equals(item.getSchoolId()))
                .filter(item -> classId == null || classId.equals(item.getClassId()))
                .filter(item -> subjectId == null || subjectId.equals(item.getSubjectId()))
                .map(this::map)
                .toList();
    }

    @Override
    public StudyMaterialResponseDto update(Long id, StudyMaterialRequestDto dto, MultipartFile material) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (user.isSchoolScoped()) dto.setSchoolId(user.schoolId());
        if (user.isRole("TEACHER")) ensureTeacherOwnsSubject(user.teacherId(), dto.getSubjectId());

        StudyMaterial sm = repository.findById(id).orElseThrow(NotFoundException::new);
        ensureCanAccess(sm);

        copyDto(sm, dto);

        if (material != null && !material.isEmpty()) {
            saveFile(sm, material);
        }

        return map(repository.save(sm));
    }

    @Override
    public void delete(Long id) {
        StudyMaterial sm = repository.findById(id).orElseThrow(NotFoundException::new);
        ensureCanAccess(sm);
        repository.delete(sm);
    }

    private void ensureCanAccess(StudyMaterial material) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (user.isSuperAdmin()) return;
        if (user.adminId() != null) {
            if (user.schoolId() != null && !user.schoolId().equals(material.getSchoolId())) throw new NotFoundException();
            return;
        }
        if (user.isRole("TEACHER")) {
            ensureTeacherOwnsSubject(user.teacherId(), material.getSubjectId());
            return;
        }
        if (user.isSchoolScoped() && user.schoolId() != null && user.schoolId().equals(material.getSchoolId())) return;
        throw new NotFoundException();
    }

    private void ensureTeacherOwnsSubject(Long teacherId, Long subjectId) {
        if (teacherId == null || subjectId == null) throw new ForbiddenException();
        boolean ok = subjectRepository.findById(subjectId)
                .map(s -> s.getTeacher() != null && teacherId.equals(s.getTeacher().getId()))
                .orElse(false);
        if (!ok) throw new ForbiddenException();
    }

    private void copyDto(StudyMaterial sm, StudyMaterialRequestDto dto) {
        sm.setSchoolId(dto.getSchoolId());
        sm.setClassId(dto.getClassId());
        sm.setSubjectId(dto.getSubjectId());
        sm.setTitle(dto.getTitle());
        sm.setDescription(dto.getDescription());
    }

    private void saveFile(StudyMaterial sm, MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) return;

            Path baseDir = Paths.get(uploadProperties.getDir()).toAbsolutePath().normalize();
            Path materialsDir = baseDir.resolve("study-materials");
            Files.createDirectories(materialsDir);

            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path path = materialsDir.resolve(fileName);

            file.transferTo(path.toFile());

            sm.setFileName(file.getOriginalFilename());
            sm.setFilePath("/uploads/study-materials/" + fileName);
            sm.setFileType(file.getContentType());
        } catch (Exception e) {
            throw new RuntimeException("File upload failed");
        }
    }

    private StudyMaterialResponseDto map(StudyMaterial sm) {
        StudyMaterialResponseDto dto = new StudyMaterialResponseDto();
        dto.setId(sm.getId());
        dto.setSchoolId(sm.getSchoolId());
        dto.setClassId(sm.getClassId());
        dto.setSubjectId(sm.getSubjectId());
        dto.setTitle(sm.getTitle());
        dto.setDescription(sm.getDescription());
        dto.setFileName(sm.getFileName());
        dto.setFilePath(sm.getFilePath());
        dto.setFileType(sm.getFileType());
        return dto;
    }
}
