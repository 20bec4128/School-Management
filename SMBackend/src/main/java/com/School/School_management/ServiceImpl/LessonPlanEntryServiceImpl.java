package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.LessonPlanEntryDto;
import com.School.School_management.Entity.Lesson;
import com.School.School_management.Entity.LessonPlanEntry;
import com.School.School_management.Entity.Student;
import com.School.School_management.Entity.Subject;
import com.School.School_management.Entity.Topic;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.LessonPlanEntryRepository;
import com.School.School_management.Repository.LessonRepository;
import com.School.School_management.Repository.ParentStudentRepository;
import com.School.School_management.Repository.StudentRepository;
import com.School.School_management.Repository.SubjectRepository;
import com.School.School_management.Repository.TopicRepository;
import com.School.School_management.Service.LessonPlanEntryService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class LessonPlanEntryServiceImpl implements LessonPlanEntryService {

    private static final Set<String> ALLOWED_STATUS = Set.of("Upcoming", "Running", "Completed");

    private final LessonPlanEntryRepository repository;
    private final LessonRepository lessonRepository;
    private final TopicRepository topicRepository;
    private final SubjectRepository subjectRepository;
    private final StudentRepository studentRepository;
    private final ParentStudentRepository parentStudentRepository;

    public LessonPlanEntryServiceImpl(
            LessonPlanEntryRepository repository,
            LessonRepository lessonRepository,
            TopicRepository topicRepository,
            SubjectRepository subjectRepository,
            StudentRepository studentRepository,
            ParentStudentRepository parentStudentRepository
    ) {
        this.repository = repository;
        this.lessonRepository = lessonRepository;
        this.topicRepository = topicRepository;
        this.subjectRepository = subjectRepository;
        this.studentRepository = studentRepository;
        this.parentStudentRepository = parentStudentRepository;
    }

    @Override
    public List<LessonPlanEntryDto> getAll(Long schoolId, String academicYear, Long classId, Long subjectId, Long lessonId, Long topicId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        if (user.isSuperAdmin()) {
            return repository.search(schoolId, academicYear, classId, subjectId, lessonId, topicId).stream().map(this::map).toList();
        }

        if (user.adminId() != null) {
            Long effectiveSchoolId = user.schoolId() != null ? user.schoolId() : schoolId;
            return repository.search(effectiveSchoolId, academicYear, classId, subjectId, lessonId, topicId).stream().map(this::map).toList();
        }

        if (user.isRole("TEACHER")) {
            List<Long> subjectIds = subjectRepository.findByTeacher_Id(user.teacherId()).stream().map(Subject::getId).toList();
            if (subjectIds.isEmpty()) return List.of();
            return repository.search(schoolId, academicYear, classId, subjectId, lessonId, topicId).stream()
                    .filter(e -> e.getSubjectId() != null && subjectIds.contains(e.getSubjectId()))
                    .map(this::map)
                    .toList();
        }

        if (user.isRole("STUDENT")) {
            Student s = studentRepository.findById(user.studentId()).orElseThrow(NotFoundException::new);
            Long sid = s.getSchool() == null ? null : s.getSchool().getId();
            Long cid = s.getSchoolClass() == null ? null : s.getSchoolClass().getId();
            if (sid == null || cid == null) return List.of();
            return repository.search(sid, academicYear, cid, subjectId, lessonId, topicId).stream().map(this::map).toList();
        }

        if (user.isRole("PARENT")) {
            Optional<Student> first = parentStudentRepository.findStudentIdsByParentId(user.parentId()).stream()
                    .map(studentRepository::findById)
                    .flatMap(Optional::stream)
                    .findFirst();
            if (first.isEmpty() || first.get().getSchool() == null || first.get().getSchoolClass() == null) return List.of();
            return repository.search(first.get().getSchool().getId(), academicYear, first.get().getSchoolClass().getId(), subjectId, lessonId, topicId)
                    .stream()
                    .map(this::map)
                    .toList();
        }

        return List.of();
    }

    @Override
    public LessonPlanEntryDto create(LessonPlanEntryDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        LessonPlanEntry entity = new LessonPlanEntry();
        Lesson lesson = applyToEntity(entity, dto);
        if (user.isRole("TEACHER")) ensureTeacherOwnsSubject(user.teacherId(), lesson.getSubjectId());
        return map(repository.save(entity));
    }

    @Override
    public LessonPlanEntryDto update(Long id, LessonPlanEntryDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        LessonPlanEntry entity = repository.findById(id).orElseThrow(NotFoundException::new);
        Lesson lesson = applyToEntity(entity, dto);
        if (user.isRole("TEACHER")) ensureTeacherOwnsSubject(user.teacherId(), lesson.getSubjectId());
        return map(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        LessonPlanEntry entity = repository.findById(id).orElseThrow(NotFoundException::new);
        repository.delete(entity);
    }

    private void ensureTeacherOwnsSubject(Long teacherId, Long subjectId) {
        if (teacherId == null || subjectId == null) throw new ForbiddenException();
        boolean ok = subjectRepository.findById(subjectId)
                .map(s -> s.getTeacher() != null && teacherId.equals(s.getTeacher().getId()))
                .orElse(false);
        if (!ok) throw new ForbiddenException();
    }

    private Lesson applyToEntity(LessonPlanEntry entity, LessonPlanEntryDto dto) {
        if (dto.getLessonId() == null) throw new BadRequestException("lessonId is required");

        Lesson lesson = lessonRepository.findById(dto.getLessonId()).orElseThrow(() -> new BadRequestException("Lesson not found"));

        Topic topic = null;
        if (dto.getTopicId() != null) {
            topic = topicRepository.findById(dto.getTopicId()).orElseThrow(() -> new BadRequestException("Topic not found"));
            if (topic.getLesson() == null || topic.getLesson().getId() == null || !topic.getLesson().getId().equals(lesson.getId())) {
                throw new BadRequestException("Topic does not belong to the lesson");
            }
        }

        validateStatus(dto.getLessonStatus());
        validateStatus(dto.getTopicStatus());

        entity.setLesson(lesson);
        entity.setTopic(topic);
        entity.setSchoolId(lesson.getSchoolId());
        entity.setAcademicYear(lesson.getAcademicYear());
        entity.setClassId(lesson.getClassId());
        entity.setSubjectId(lesson.getSubjectId());

        entity.setLessonStartDate(dto.getLessonStartDate());
        entity.setLessonEndDate(dto.getLessonEndDate());
        entity.setLessonStatus(dto.getLessonStatus());

        entity.setTopicStartDate(dto.getTopicStartDate());
        entity.setTopicEndDate(dto.getTopicEndDate());
        entity.setTopicStatus(dto.getTopicStatus());

        return lesson;
    }

    private void validateStatus(String status) {
        if (status == null || status.isBlank()) return;
        if (!ALLOWED_STATUS.contains(status)) throw new BadRequestException("Invalid status: " + status);
    }

    private LessonPlanEntryDto map(LessonPlanEntry entity) {
        LessonPlanEntryDto dto = new LessonPlanEntryDto();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setAcademicYear(entity.getAcademicYear());
        dto.setClassId(entity.getClassId());
        dto.setSubjectId(entity.getSubjectId());

        Lesson lesson = entity.getLesson();
        if (lesson != null) {
            dto.setLessonId(lesson.getId());
            dto.setLesson(lesson.getLesson());
            dto.setSchoolName(lesson.getSchoolName());
            dto.setClassName(lesson.getClassName());
            dto.setSubjectName(lesson.getSubjectName());
        }

        Topic topic = entity.getTopic();
        if (topic != null) {
            dto.setTopicId(topic.getId());
            dto.setTopic(topic.getTopic());
        }

        dto.setLessonStartDate(entity.getLessonStartDate());
        dto.setLessonEndDate(entity.getLessonEndDate());
        dto.setLessonStatus(entity.getLessonStatus());

        dto.setTopicStartDate(entity.getTopicStartDate());
        dto.setTopicEndDate(entity.getTopicEndDate());
        dto.setTopicStatus(entity.getTopicStatus());

        return dto;
    }
}
