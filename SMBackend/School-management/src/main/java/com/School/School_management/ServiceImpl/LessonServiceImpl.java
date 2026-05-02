package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.LessonDto;
import com.School.School_management.Entity.Lesson;
import com.School.School_management.Entity.SchoolClass;
import com.School.School_management.Entity.Subject;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.ParentStudentRepository;
import com.School.School_management.Repository.LessonRepository;
import com.School.School_management.Repository.SchoolClassRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.StudentRepository;
import com.School.School_management.Repository.SubjectRepository;
import com.School.School_management.Service.LessonService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class LessonServiceImpl implements LessonService {

    private final LessonRepository lessonRepository;
    private final SchoolRepository schoolRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SubjectRepository subjectRepository;
    private final StudentRepository studentRepository;
    private final ParentStudentRepository parentStudentRepository;

    public LessonServiceImpl(
            LessonRepository lessonRepository,
            SchoolRepository schoolRepository,
            SchoolClassRepository schoolClassRepository,
            SubjectRepository subjectRepository,
            StudentRepository studentRepository,
            ParentStudentRepository parentStudentRepository
    ) {
        this.lessonRepository = lessonRepository;
        this.schoolRepository = schoolRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.subjectRepository = subjectRepository;
        this.studentRepository = studentRepository;
        this.parentStudentRepository = parentStudentRepository;
    }

    @Override
    public List<LessonDto> getAll(Long schoolId, String academicYear, Long classId, Long subjectId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        if (user.isSuperAdmin()) {
            return lessonRepository.search(schoolId, academicYear, classId, subjectId).stream().map(this::map).toList();
        }

        if (user.adminId() != null) {
            Long effectiveSchoolId = user.schoolId() != null ? user.schoolId() : schoolId;
            return lessonRepository.search(effectiveSchoolId, academicYear, classId, subjectId).stream().map(this::map).toList();
        }

        if (user.isRole("TEACHER")) {
            List<Long> subjectIds = subjectRepository.findByTeacher_Id(user.teacherId()).stream().map(Subject::getId).toList();
            if (subjectIds.isEmpty()) return List.of();
            return lessonRepository.search(schoolId, academicYear, classId, subjectId).stream()
                    .filter(l -> l.getSubjectId() != null && subjectIds.contains(l.getSubjectId()))
                    .map(this::map)
                    .toList();
        }

        if (user.isRole("STUDENT")) {
            var student = studentRepository.findById(user.studentId()).orElseThrow(NotFoundException::new);
            Long sid = student.getSchool() == null ? null : student.getSchool().getId();
            Long cid = student.getSchoolClass() == null ? null : student.getSchoolClass().getId();
            if (sid == null || cid == null) return List.of();
            return lessonRepository.search(sid, academicYear, cid, subjectId).stream().map(this::map).toList();
        }

        if (user.isRole("PARENT")) {
            List<Long> childIds = parentStudentRepository.findStudentIdsByParentId(user.parentId());
            var first = childIds.stream().map(studentRepository::findById).flatMap(java.util.Optional::stream).findFirst();
            if (first.isEmpty() || first.get().getSchool() == null || first.get().getSchoolClass() == null) return List.of();
            Long sid = first.get().getSchool().getId();
            Long cid = first.get().getSchoolClass().getId();
            return lessonRepository.search(sid, academicYear, cid, subjectId).stream().map(this::map).toList();
        }

        return List.of();
    }

    @Override
    public LessonDto create(LessonDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (user.isRole("TEACHER")) ensureTeacherOwnsSubject(user.teacherId(), dto.getSubjectId());

        Lesson lesson = new Lesson();
        applyToEntity(lesson, dto);
        return map(lessonRepository.save(lesson));
    }

    @Override
    public LessonDto update(Long id, LessonDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (user.isRole("TEACHER")) ensureTeacherOwnsSubject(user.teacherId(), dto.getSubjectId());

        Lesson lesson = lessonRepository.findById(id).orElseThrow(NotFoundException::new);
        applyToEntity(lesson, dto);
        return map(lessonRepository.save(lesson));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Lesson lesson = lessonRepository.findById(id).orElseThrow(NotFoundException::new);
        // School scoping is enforced at controller level (SchoolGuard) for admins; keep basic existence check here.
        lessonRepository.delete(lesson);
    }

    private void ensureTeacherOwnsSubject(Long teacherId, Long subjectId) {
        if (teacherId == null || subjectId == null) throw new ForbiddenException();
        boolean ok = subjectRepository.findById(subjectId)
                .map(s -> s.getTeacher() != null && teacherId.equals(s.getTeacher().getId()))
                .orElse(false);
        if (!ok) throw new ForbiddenException();
    }

    private void applyToEntity(Lesson entity, LessonDto dto) {
        if (dto.getSchoolId() == null || dto.getClassId() == null || dto.getSubjectId() == null) {
            throw new BadRequestException("schoolId, classId and subjectId are required");
        }
        if (dto.getAcademicYear() == null || dto.getAcademicYear().isBlank()) {
            throw new BadRequestException("academicYear is required");
        }
        if (dto.getLesson() == null || dto.getLesson().isBlank()) {
            throw new BadRequestException("lesson is required");
        }

        var school = schoolRepository.findById(dto.getSchoolId()).orElseThrow(() -> new BadRequestException("School not found"));
        SchoolClass schoolClass = schoolClassRepository.findById(dto.getClassId()).orElseThrow(() -> new BadRequestException("Class not found"));
        Subject subject = subjectRepository.findById(dto.getSubjectId()).orElseThrow(() -> new BadRequestException("Subject not found"));

        // Optional cross-checks (avoid mismatched scope)
        if (schoolClass.getSchool() != null && !dto.getSchoolId().equals(schoolClass.getSchool().getId())) {
            throw new BadRequestException("Class does not belong to selected school");
        }
        if (subject.getSchool() != null && !dto.getSchoolId().equals(subject.getSchool().getId())) {
            throw new BadRequestException("Subject does not belong to selected school");
        }
        if (subject.getSchoolClass() != null && !dto.getClassId().equals(subject.getSchoolClass().getId())) {
            throw new BadRequestException("Subject does not belong to selected class");
        }

        entity.setSchoolId(dto.getSchoolId());
        entity.setSchoolName(school.getSchoolName());
        entity.setAcademicYear(dto.getAcademicYear());
        entity.setClassId(dto.getClassId());
        entity.setClassName(schoolClass.getClassName());
        entity.setSubjectId(dto.getSubjectId());
        entity.setSubjectName(subject.getName());
        entity.setLesson(dto.getLesson());
        entity.setNote(dto.getNote());
    }

    private LessonDto map(Lesson lesson) {
        LessonDto dto = new LessonDto();
        dto.setId(lesson.getId());
        dto.setSchoolId(lesson.getSchoolId());
        dto.setSchoolName(lesson.getSchoolName());
        dto.setAcademicYear(lesson.getAcademicYear());
        dto.setClassId(lesson.getClassId());
        dto.setClassName(lesson.getClassName());
        dto.setSubjectId(lesson.getSubjectId());
        dto.setSubjectName(lesson.getSubjectName());
        dto.setLesson(lesson.getLesson());
        dto.setNote(lesson.getNote());
        return dto;
    }
}
