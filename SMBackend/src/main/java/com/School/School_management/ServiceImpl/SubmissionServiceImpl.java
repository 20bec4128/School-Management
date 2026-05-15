package com.School.School_management.ServiceImpl;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.School.School_management.Dto.SubmissionEvaluateDto;
import com.School.School_management.Dto.SubmissionRequestDto;
import com.School.School_management.Entity.Submission;
import com.School.School_management.Entity.Student;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.config.UploadProperties;
import com.School.School_management.Repository.AssignmentRepository;
import com.School.School_management.Repository.ParentStudentRepository;
import com.School.School_management.Repository.StudentRepository;
import com.School.School_management.Repository.SubjectRepository;
import com.School.School_management.Repository.SubmissionRepository;
import com.School.School_management.Service.SubmissionService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;

@Service
public class SubmissionServiceImpl implements SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubjectRepository subjectRepository;
    private final StudentRepository studentRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final Path submissionUploadDir;

    public SubmissionServiceImpl(
            SubmissionRepository submissionRepository,
            AssignmentRepository assignmentRepository,
            SubjectRepository subjectRepository,
            StudentRepository studentRepository,
            ParentStudentRepository parentStudentRepository,
            UploadProperties uploadProperties
    ) {
        this.submissionRepository = submissionRepository;
        this.assignmentRepository = assignmentRepository;
        this.subjectRepository = subjectRepository;
        this.studentRepository = studentRepository;
        this.parentStudentRepository = parentStudentRepository;
        this.submissionUploadDir = Paths.get(uploadProperties.getDir(), "submissions").toAbsolutePath().normalize();
    }

    @Override
    public Submission createSubmission(SubmissionRequestDto dto, MultipartFile file) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Student student = resolveSubmissionStudentForCreate(user, dto);
        dto.setStudentId(student.getId());
        dto.setSchoolId(student.getSchool() == null ? null : student.getSchool().getId());
        dto.setClassId(student.getSchoolClass() == null ? null : student.getSchoolClass().getId());
        dto.setSectionId(student.getSchoolSection() == null ? null : student.getSchoolSection().getId());

        submissionRepository
                .findByAssignmentIdAndStudentId(dto.getAssignmentId(), dto.getStudentId())
                .ifPresent(existing -> {
                    throw new RuntimeException("Assignment already submitted by this student");
                });

        Submission submission = new Submission();
        submission.setSchoolId(dto.getSchoolId());
        submission.setClassId(dto.getClassId());
        submission.setSectionId(dto.getSectionId());
        submission.setStudentId(dto.getStudentId());
        submission.setAssignmentId(dto.getAssignmentId());
        submission.setNote(dto.getNote());
        submission.setEvaluate("Pending");
        submission.setSubmittedAt(LocalDateTime.now());

        if (file != null && !file.isEmpty()) {
            submission.setFileUrl(saveFile(file));
        }

        return submissionRepository.save(submission);
    }

    @Override
    public List<Submission> getAllSubmissions() {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (user.isSuperAdmin()) return submissionRepository.findAll();
        if (user.adminId() != null) {
            if (user.schoolId() == null) return submissionRepository.findAll();
            return submissionRepository.findBySchoolId(user.schoolId());
        }
        if (user.isRole("TEACHER")) {
            if (user.schoolId() != null) {
                return submissionRepository.findBySchoolId(user.schoolId());
            }
            return getTeacherSubmissions(user.teacherId());
        }
        throw new ForbiddenException();
    }

    @Override
    public Submission getSubmissionById(Long id) {
        Submission submission = submissionRepository.findById(id).orElseThrow(NotFoundException::new);
        ensureCanAccess(submission);
        return submission;
    }

    @Override
    public List<Submission> getByAssignment(Long assignmentId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (user.isRole("TEACHER")) {
            ensureTeacherOwnsAssignment(user.teacherId(), assignmentId);
        }
        if (user.isSchoolScoped()) {
            return submissionRepository.findByAssignmentId(assignmentId).stream()
                    .filter(s -> user.schoolId().equals(s.getSchoolId()))
                    .toList();
        }
        return submissionRepository.findByAssignmentId(assignmentId);
    }

    @Override
    public List<Submission> getByStudent(Long studentId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        if (user.isRole("STUDENT")) {
            studentId = user.studentId();
        } else if (user.isRole("PARENT")) {
            if (user.parentId() == null) throw new ForbiddenException();
            if (!parentStudentRepository.findStudentIdsByParentId(user.parentId()).contains(studentId)) {
                throw new NotFoundException();
            }
        }

        List<Submission> list = submissionRepository.findByStudentId(studentId);
        if (user.isRole("TEACHER")) {
            return list.stream().filter(s -> teacherOwnsAssignment(user.teacherId(), s.getAssignmentId())).toList();
        }
        if (user.isSchoolScoped()) {
            return list.stream().filter(s -> user.schoolId().equals(s.getSchoolId())).toList();
        }
        return list;
    }

    @Override
    public Submission evaluateSubmission(Long id, SubmissionEvaluateDto dto) {
        Submission submission = getSubmissionById(id);
        CurrentUser user = CurrentUserHolder.get();
        if (user != null && user.isRole("TEACHER")) {
            ensureTeacherOwnsAssignment(user.teacherId(), submission.getAssignmentId());
        }
        submission.setMarks(dto.getMarks());
        submission.setFeedback(dto.getFeedback());
        submission.setEvaluate("Accepted");
        return submissionRepository.save(submission);
    }

    @Override
    public Submission updateSubmission(Long id, SubmissionRequestDto dto, MultipartFile file) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Submission submission = submissionRepository.findById(id).orElseThrow(NotFoundException::new);
        ensureCanEditSubmission(user, submission);

        if (dto != null && dto.getAssignmentId() != null && !dto.getAssignmentId().equals(submission.getAssignmentId())) {
            throw new ForbiddenException();
        }

        if (dto != null && dto.getNote() != null) {
            submission.setNote(dto.getNote());
        } else if (dto != null) {
            submission.setNote(null);
        }

        if (file != null && !file.isEmpty()) {
            submission.setFileUrl(saveFile(file));
        }

        // Resubmitting should move the review back to pending.
        submission.setEvaluate("Pending");
        submission.setMarks(null);
        submission.setFeedback(null);
        submission.setSubmittedAt(LocalDateTime.now());

        return submissionRepository.save(submission);
    }

    @Override
    public void deleteSubmission(Long id) {
        Submission submission = getSubmissionById(id);
        submissionRepository.delete(submission);
    }

    private void ensureCanAccess(Submission submission) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (user.isSuperAdmin()) return;
        if (user.adminId() != null) {
            if (user.schoolId() == null) return;
            if (!user.schoolId().equals(submission.getSchoolId())) throw new NotFoundException();
            return;
        }
        if (user.isRole("STUDENT")) {
            if (user.studentId() == null || !user.studentId().equals(submission.getStudentId())) throw new NotFoundException();
            return;
        }
        if (user.isRole("PARENT")) {
            if (user.parentId() == null) throw new ForbiddenException();
            if (!parentStudentRepository.findStudentIdsByParentId(user.parentId()).contains(submission.getStudentId())) {
                throw new NotFoundException();
            }
            return;
        }
        if (user.isRole("TEACHER")) {
            if (!teacherOwnsAssignment(user.teacherId(), submission.getAssignmentId())) throw new NotFoundException();
            return;
        }
        throw new ForbiddenException();
    }

    private void ensureTeacherOwnsAssignment(Long teacherId, Long assignmentId) {
        if (!teacherOwnsAssignment(teacherId, assignmentId)) throw new ForbiddenException();
    }

    private Student resolveSubmissionStudentForCreate(CurrentUser user, SubmissionRequestDto dto) {
        if (user.isSuperAdmin()) {
            Long requestedStudentId = dto == null ? null : dto.getStudentId();
            if (requestedStudentId == null) throw new ForbiddenException();
            return studentRepository.findById(requestedStudentId).orElseThrow(NotFoundException::new);
        }

        if (user.isRole("STUDENT")) {
            if (user.studentId() == null) throw new ForbiddenException();
            return studentRepository.findById(user.studentId()).orElseThrow(NotFoundException::new);
        }

        if (user.isRole("PARENT")) {
            if (user.parentId() == null) throw new ForbiddenException();
            Long requestedStudentId = dto == null ? null : dto.getStudentId();
            if (requestedStudentId == null) throw new ForbiddenException();
            if (!parentStudentRepository.findStudentIdsByParentId(user.parentId()).contains(requestedStudentId)) {
                throw new ForbiddenException();
            }
            return studentRepository.findById(requestedStudentId).orElseThrow(NotFoundException::new);
        }

        throw new ForbiddenException();
    }

    private void ensureCanEditSubmission(CurrentUser user, Submission submission) {
        if (user.isSuperAdmin()) {
            return;
        }
        if (user.isRole("STUDENT")) {
            if (user.studentId() == null || !user.studentId().equals(submission.getStudentId())) throw new NotFoundException();
            return;
        }
        if (user.isRole("PARENT")) {
            if (user.parentId() == null) throw new ForbiddenException();
            if (!parentStudentRepository.findStudentIdsByParentId(user.parentId()).contains(submission.getStudentId())) {
                throw new NotFoundException();
            }
            return;
        }
        throw new ForbiddenException();
    }

    private boolean teacherOwnsAssignment(Long teacherId, Long assignmentId) {
        if (teacherId == null || assignmentId == null) return false;
        return assignmentRepository.findById(assignmentId)
                .map(a -> a.getSubjectId() != null && subjectRepository.findById(a.getSubjectId())
                        .map(s -> s.getTeacher() != null && teacherId.equals(s.getTeacher().getId()))
                        .orElse(false))
                .orElse(false);
    }

    private List<Submission> getTeacherSubmissions(Long teacherId) {
        if (teacherId == null) return List.of();

        List<Long> subjectIds = subjectRepository.findByTeacher_Id(teacherId).stream()
                .map(s -> s.getId())
                .filter(java.util.Objects::nonNull)
                .toList();
        if (subjectIds.isEmpty()) return List.of();

        List<Long> assignmentIds = assignmentRepository.findBySubjectIdIn(subjectIds).stream()
                .map(a -> a.getId())
                .filter(java.util.Objects::nonNull)
                .toList();
        if (assignmentIds.isEmpty()) return List.of();

        return submissionRepository.findByAssignmentIdIn(assignmentIds);
    }

    private String saveFile(MultipartFile file) {
        try {
            Files.createDirectories(submissionUploadDir);
            String originalName = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
            String sanitizedName = Paths.get(originalName)
                    .getFileName()
                    .toString()
                    .replaceAll("[^a-zA-Z0-9._-]", "_");
            String fileName = UUID.randomUUID() + "_" + sanitizedName;

            Path targetPath = submissionUploadDir.resolve(fileName).normalize();
            file.transferTo(targetPath.toFile());

            return "/uploads/submissions/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("File upload failed: " + e.getMessage(), e);
        }
    }
}
