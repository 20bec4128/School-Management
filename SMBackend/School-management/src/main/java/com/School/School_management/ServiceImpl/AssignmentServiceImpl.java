package com.School.School_management.ServiceImpl;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.School.School_management.Dto.AssignmentRequestDto;
import com.School.School_management.Entity.Assignment;
import com.School.School_management.Entity.Student;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.config.UploadProperties;
import com.School.School_management.Repository.AssignmentRepository;
import com.School.School_management.Repository.ParentStudentRepository;
import com.School.School_management.Repository.StudentRepository;
import com.School.School_management.Repository.SubjectRepository;
import com.School.School_management.Service.AssignmentService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.nio.file.Files;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

@Service
public class AssignmentServiceImpl implements AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final SubjectRepository subjectRepository;
    private final StudentRepository studentRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final Path assignmentUploadDir;

    public AssignmentServiceImpl(
            AssignmentRepository assignmentRepository,
            SubjectRepository subjectRepository,
            StudentRepository studentRepository,
            ParentStudentRepository parentStudentRepository,
            UploadProperties uploadProperties
    ) {
        this.assignmentRepository = assignmentRepository;
        this.subjectRepository = subjectRepository;
        this.studentRepository = studentRepository;
        this.parentStudentRepository = parentStudentRepository;
        this.assignmentUploadDir = Paths.get(uploadProperties.getDir(), "assignments").toAbsolutePath().normalize();
    }

    @Override
    public Assignment createAssignment(AssignmentRequestDto dto, MultipartFile file) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        if (user.isSchoolScoped()) {
            dto.setSchoolId(user.schoolId());
        }
        if (user.isRole("TEACHER")) {
            ensureTeacherOwnsSubject(user.teacherId(), dto.getSubjectId());
        }

        Assignment assignment = new Assignment();

        mapDtoToEntity(dto, assignment);

        if (file != null && !file.isEmpty()) {
            assignment.setAssignmentFile(saveFile(file));
        }

        return assignmentRepository.save(assignment);
    }

    @Override
    public List<Assignment> getAllAssignments() {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        if (user.isSuperAdmin()) return assignmentRepository.findAll();
        if (user.adminId() != null) {
            if (user.schoolId() == null) return assignmentRepository.findAll();
            return assignmentRepository.findBySchoolId(user.schoolId());
        }
        if (user.isRole("TEACHER")) {
            Collection<Long> subjectIds = subjectRepository.findByTeacher_Id(user.teacherId()).stream().map(s -> s.getId()).toList();
            if (subjectIds.isEmpty()) return List.of();
            return assignmentRepository.findBySubjectIdIn(subjectIds);
        }
        if (user.isRole("STUDENT")) {
            Student s = studentRepository.findById(user.studentId()).orElseThrow(NotFoundException::new);
            Long schoolId = s.getSchool() == null ? null : s.getSchool().getId();
            if (schoolId == null || s.getSchoolClass() == null || s.getSchoolSection() == null) return List.of();
            return assignmentRepository.findBySchoolIdAndClassIdAndSectionId(
                    schoolId,
                    s.getSchoolClass().getId(),
                    s.getSchoolSection().getId()
            );
        }
        if (user.isRole("PARENT")) {
            Set<Long> subjectIds = new HashSet<>();
            for (Long sid : parentStudentRepository.findStudentIdsByParentId(user.parentId())) {
                studentRepository.findById(sid).ifPresent((s) -> {
                    if (s.getSchoolClass() != null) {
                        // Assignments are class/section scoped in this backend.
                    }
                });
            }
            // Best-effort: parents can fetch assignments via other child-specific endpoints later.
            return List.of();
        }
        return List.of();
    }

    @Override
    public Assignment getAssignmentById(Long id) {
        Assignment assignment = assignmentRepository.findById(id).orElseThrow(NotFoundException::new);
        ensureCanAccess(assignment);
        return assignment;
    }

    @Override
    public Assignment updateAssignment(Long id, AssignmentRequestDto dto, MultipartFile file) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (user.isSchoolScoped()) {
            dto.setSchoolId(user.schoolId());
        }
        if (user.isRole("TEACHER")) {
            ensureTeacherOwnsSubject(user.teacherId(), dto.getSubjectId());
        }

        Assignment assignment = getAssignmentById(id);

        mapDtoToEntity(dto, assignment);

        if (file != null && !file.isEmpty()) {
            assignment.setAssignmentFile(saveFile(file));
        }

        return assignmentRepository.save(assignment);
    }

    @Override
    public void deleteAssignment(Long id) {
        Assignment assignment = getAssignmentById(id);
        assignmentRepository.delete(assignment);
    }

    private void ensureTeacherOwnsSubject(Long teacherId, Long subjectId) {
        if (teacherId == null || subjectId == null) throw new ForbiddenException();
        boolean ok = subjectRepository.findById(subjectId)
                .map(s -> s.getTeacher() != null && teacherId.equals(s.getTeacher().getId()))
                .orElse(false);
        if (!ok) throw new ForbiddenException();
    }

    private void ensureCanAccess(Assignment assignment) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (user.isSuperAdmin() || user.adminId() != null) return;

        if (user.isRole("TEACHER")) {
            ensureTeacherOwnsSubject(user.teacherId(), assignment.getSubjectId());
            return;
        }

        if (user.isRole("STUDENT")) {
            Student s = studentRepository.findById(user.studentId()).orElseThrow(NotFoundException::new);
            Long schoolId = s.getSchool() == null ? null : s.getSchool().getId();
            if (schoolId == null) throw new ForbiddenException();
            boolean ok = schoolId.equals(assignment.getSchoolId())
                    && s.getSchoolClass() != null && s.getSchoolClass().getId() != null
                    && s.getSchoolSection() != null && s.getSchoolSection().getId() != null
                    && s.getSchoolClass().getId().equals(assignment.getClassId())
                    && s.getSchoolSection().getId().equals(assignment.getSectionId());
            if (!ok) throw new NotFoundException();
            return;
        }

        throw new ForbiddenException();
    }

    private void mapDtoToEntity(AssignmentRequestDto dto, Assignment assignment) {
        assignment.setSchoolId(dto.getSchoolId());
        assignment.setClassId(dto.getClassId());
        assignment.setSectionId(dto.getSectionId());
        assignment.setSubjectId(dto.getSubjectId());

        assignment.setTitle(dto.getTitle());
        assignment.setAssignmentDate(dto.getAssignmentDate());
        assignment.setSubmissionDate(dto.getSubmissionDate());

        assignment.setSmsNotification(Boolean.TRUE.equals(dto.getSmsNotification()));
        assignment.setEmailNotification(Boolean.TRUE.equals(dto.getEmailNotification()));

        assignment.setNote(dto.getNote());
        assignment.setStatus(dto.getStatus() == null || dto.getStatus().isBlank() ? "Pending" : dto.getStatus());
    }

    private String saveFile(MultipartFile file) {
        try {
            Files.createDirectories(assignmentUploadDir);
            String originalName = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
            String sanitizedName = Paths.get(originalName)
                    .getFileName()
                    .toString()
                    .replaceAll("[^a-zA-Z0-9._-]", "_");
            String fileName = UUID.randomUUID() + "_" + sanitizedName;

            Path targetPath = assignmentUploadDir.resolve(fileName).normalize();
            file.transferTo(targetPath.toFile());

            return "/uploads/assignments/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload assignment file: " + e.getMessage(), e);
        }
    }
}
