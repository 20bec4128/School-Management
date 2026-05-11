package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.TopicDto;
import com.School.School_management.Entity.Lesson;
import com.School.School_management.Entity.Student;
import com.School.School_management.Entity.Subject;
import com.School.School_management.Entity.Topic;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.LessonRepository;
import com.School.School_management.Repository.ParentStudentRepository;
import com.School.School_management.Repository.StudentRepository;
import com.School.School_management.Repository.SubjectRepository;
import com.School.School_management.Repository.TopicRepository;
import com.School.School_management.Service.TopicService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TopicServiceImpl implements TopicService {

    private final TopicRepository topicRepository;
    private final LessonRepository lessonRepository;
    private final SubjectRepository subjectRepository;
    private final StudentRepository studentRepository;
    private final ParentStudentRepository parentStudentRepository;

    public TopicServiceImpl(
            TopicRepository topicRepository,
            LessonRepository lessonRepository,
            SubjectRepository subjectRepository,
            StudentRepository studentRepository,
            ParentStudentRepository parentStudentRepository
    ) {
        this.topicRepository = topicRepository;
        this.lessonRepository = lessonRepository;
        this.subjectRepository = subjectRepository;
        this.studentRepository = studentRepository;
        this.parentStudentRepository = parentStudentRepository;
    }

    @Override
    public List<TopicDto> getAll(Long schoolId, String academicYear, Long classId, Long subjectId, Long lessonId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        if (user.isSuperAdmin()) {
            return topicRepository.search(schoolId, academicYear, classId, subjectId, lessonId).stream().map(this::map).toList();
        }

        if (user.adminId() != null) {
            Long effectiveSchoolId = user.schoolId() != null ? user.schoolId() : schoolId;
            return topicRepository.search(effectiveSchoolId, academicYear, classId, subjectId, lessonId).stream().map(this::map).toList();
        }

        if (user.isRole("TEACHER")) {
            List<Long> subjectIds = subjectRepository.findByTeacher_Id(user.teacherId()).stream().map(Subject::getId).toList();
            if (subjectIds.isEmpty()) return List.of();
            return topicRepository.search(schoolId, academicYear, classId, subjectId, lessonId).stream()
                    .filter(t -> t.getSubjectId() != null && subjectIds.contains(t.getSubjectId()))
                    .map(this::map)
                    .toList();
        }

        if (user.isRole("STUDENT")) {
            Student s = studentRepository.findById(user.studentId()).orElseThrow(NotFoundException::new);
            Long sid = s.getSchool() == null ? null : s.getSchool().getId();
            Long cid = s.getSchoolClass() == null ? null : s.getSchoolClass().getId();
            if (sid == null || cid == null) return List.of();
            return topicRepository.search(sid, academicYear, cid, subjectId, lessonId).stream().map(this::map).toList();
        }

        if (user.isRole("PARENT")) {
            Optional<Student> first = parentStudentRepository.findStudentIdsByParentId(user.parentId()).stream()
                    .map(studentRepository::findById)
                    .flatMap(Optional::stream)
                    .findFirst();
            if (first.isEmpty() || first.get().getSchool() == null || first.get().getSchoolClass() == null) return List.of();
            return topicRepository.search(first.get().getSchool().getId(), academicYear, first.get().getSchoolClass().getId(), subjectId, lessonId).stream()
                    .map(this::map)
                    .toList();
        }

        return List.of();
    }

    @Override
    public TopicDto create(TopicDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Topic topic = new Topic();
        Lesson lesson = applyToEntity(topic, dto);
        if (user.isRole("TEACHER")) ensureTeacherOwnsSubject(user.teacherId(), lesson.getSubjectId());
        return map(topicRepository.save(topic));
    }

    @Override
    public TopicDto update(Long id, TopicDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Topic topic = topicRepository.findById(id).orElseThrow(NotFoundException::new);
        Lesson lesson = applyToEntity(topic, dto);
        if (user.isRole("TEACHER")) ensureTeacherOwnsSubject(user.teacherId(), lesson.getSubjectId());
        return map(topicRepository.save(topic));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Topic topic = topicRepository.findById(id).orElseThrow(NotFoundException::new);
        topicRepository.delete(topic);
    }

    private void ensureTeacherOwnsSubject(Long teacherId, Long subjectId) {
        if (teacherId == null || subjectId == null) throw new ForbiddenException();
        boolean ok = subjectRepository.findById(subjectId)
                .map(s -> s.getTeacher() != null && teacherId.equals(s.getTeacher().getId()))
                .orElse(false);
        if (!ok) throw new ForbiddenException();
    }

    private Lesson applyToEntity(Topic entity, TopicDto dto) {
        if (dto.getLessonId() == null) throw new BadRequestException("lessonId is required");
        if (dto.getTopic() == null || dto.getTopic().isBlank()) throw new BadRequestException("topic is required");

        Lesson lesson = lessonRepository.findById(dto.getLessonId()).orElseThrow(() -> new BadRequestException("Lesson not found"));

        // Validate scope if caller provided it (UI will)
        if (dto.getSchoolId() != null && lesson.getSchoolId() != null && !dto.getSchoolId().equals(lesson.getSchoolId())) {
            throw new BadRequestException("Lesson does not belong to selected school");
        }
        if (dto.getClassId() != null && lesson.getClassId() != null && !dto.getClassId().equals(lesson.getClassId())) {
            throw new BadRequestException("Lesson does not belong to selected class");
        }
        if (dto.getSubjectId() != null && lesson.getSubjectId() != null && !dto.getSubjectId().equals(lesson.getSubjectId())) {
            throw new BadRequestException("Lesson does not belong to selected subject");
        }
        if (dto.getAcademicYear() != null && lesson.getAcademicYear() != null && !dto.getAcademicYear().equals(lesson.getAcademicYear())) {
            throw new BadRequestException("Lesson does not belong to selected academic year");
        }

        entity.setLesson(lesson);
        entity.setSchoolId(lesson.getSchoolId());
        entity.setAcademicYear(lesson.getAcademicYear());
        entity.setClassId(lesson.getClassId());
        entity.setSubjectId(lesson.getSubjectId());
        entity.setTopic(dto.getTopic());
        entity.setNote(dto.getNote());
        return lesson;
    }

    private TopicDto map(Topic topic) {
        TopicDto dto = new TopicDto();
        dto.setId(topic.getId());
        dto.setSchoolId(topic.getSchoolId());
        dto.setAcademicYear(topic.getAcademicYear());
        dto.setClassId(topic.getClassId());
        dto.setSubjectId(topic.getSubjectId());
        if (topic.getLesson() != null) {
            dto.setLessonId(topic.getLesson().getId());
            dto.setLesson(topic.getLesson().getLesson());
            dto.setSchoolName(topic.getLesson().getSchoolName());
            dto.setClassName(topic.getLesson().getClassName());
            dto.setSubjectName(topic.getLesson().getSubjectName());
        }
        dto.setTopic(topic.getTopic());
        dto.setNote(topic.getNote());
        return dto;
    }
}
