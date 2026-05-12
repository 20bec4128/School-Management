package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.LessonPlanRowDto;
import com.School.School_management.Dto.LessonTimelineLessonDto;
import com.School.School_management.Dto.LessonTimelineTopicDto;
import com.School.School_management.Dto.UpdateTimelineRequestDto;
import com.School.School_management.Entity.Lesson;
import com.School.School_management.Entity.LessonTimeline;
import com.School.School_management.Entity.Topic;
import com.School.School_management.Entity.TopicTimeline;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.LessonRepository;
import com.School.School_management.Repository.LessonTimelineRepository;
import com.School.School_management.Repository.TopicRepository;
import com.School.School_management.Repository.TopicTimelineRepository;
import com.School.School_management.Service.LessonTimelineService;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.auth.SchoolGuard;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class LessonTimelineServiceImpl implements LessonTimelineService {

    private final LessonRepository lessonRepository;
    private final TopicRepository topicRepository;
    private final LessonTimelineRepository lessonTimelineRepository;
    private final TopicTimelineRepository topicTimelineRepository;
    private final SchoolGuard schoolGuard;

    public LessonTimelineServiceImpl(
            LessonRepository lessonRepository,
            TopicRepository topicRepository,
            LessonTimelineRepository lessonTimelineRepository,
            TopicTimelineRepository topicTimelineRepository,
            SchoolGuard schoolGuard
    ) {
        this.lessonRepository = lessonRepository;
        this.topicRepository = topicRepository;
        this.lessonTimelineRepository = lessonTimelineRepository;
        this.topicTimelineRepository = topicTimelineRepository;
        this.schoolGuard = schoolGuard;
    }

    @Override
    public List<LessonTimelineLessonDto> listLessons(Long schoolId, String academicYear, Long classId, Long subjectId) {
        if (schoolId == null || classId == null || academicYear == null || academicYear.isBlank()) {
            throw new BadRequestException("schoolId, academicYear and classId are required");
        }
        Long effectiveSchoolId = schoolGuard.schoolIdForRead(CurrentUserHolder.get(), schoolId);

        List<Lesson> lessons = lessonRepository.search(effectiveSchoolId, academicYear, classId, subjectId).stream()
                .sorted(Comparator.comparing(l -> String.valueOf(l.getLesson()), String.CASE_INSENSITIVE_ORDER))
                .toList();

        List<Long> lessonIds = lessons.stream().map(Lesson::getId).filter(id -> id != null).toList();
        Map<Long, LessonTimeline> timelineByLessonId = new HashMap<>();
        if (!lessonIds.isEmpty()) {
            for (LessonTimeline lt : lessonTimelineRepository.findByLesson_IdIn(lessonIds)) {
                Lesson l = lt.getLesson();
                if (l != null && l.getId() != null) timelineByLessonId.put(l.getId(), lt);
            }
        }

        return lessons.stream().map(l -> {
            LessonTimelineLessonDto dto = new LessonTimelineLessonDto();
            dto.setLessonId(l.getId());
            dto.setLessonName(l.getLesson());
            LessonTimeline lt = timelineByLessonId.get(l.getId());
            dto.setStartDate(lt != null ? lt.getStartDate() : null);
            dto.setEndDate(lt != null ? lt.getEndDate() : null);
            return dto;
        }).toList();
    }

    @Override
    public List<LessonTimelineTopicDto> listTopics(Long schoolId, String academicYear, Long classId, Long subjectId, Long lessonId) {
        if (schoolId == null || classId == null || lessonId == null || academicYear == null || academicYear.isBlank()) {
            throw new BadRequestException("schoolId, academicYear, classId and lessonId are required");
        }
        Long effectiveSchoolId = schoolGuard.schoolIdForRead(CurrentUserHolder.get(), schoolId);

        Lesson lesson = lessonRepository.findById(lessonId).orElseThrow(NotFoundException::new);
        if (!effectiveSchoolId.equals(lesson.getSchoolId())) throw new NotFoundException();

        List<Topic> topics = topicRepository.search(effectiveSchoolId, academicYear, classId, subjectId, lessonId).stream()
                .sorted(Comparator.comparing(t -> String.valueOf(t.getTopic()), String.CASE_INSENSITIVE_ORDER))
                .toList();
        List<Long> topicIds = topics.stream().map(Topic::getId).filter(id -> id != null).toList();

        Map<Long, TopicTimeline> timelineByTopicId = new HashMap<>();
        if (!topicIds.isEmpty()) {
            for (TopicTimeline tt : topicTimelineRepository.findByTopic_IdIn(topicIds)) {
                Topic t = tt.getTopic();
                if (t != null && t.getId() != null) timelineByTopicId.put(t.getId(), tt);
            }
        }

        return topics.stream().map(t -> {
            LessonTimelineTopicDto dto = new LessonTimelineTopicDto();
            dto.setTopicId(t.getId());
            dto.setTopicName(t.getTopic());
            TopicTimeline tt = timelineByTopicId.get(t.getId());
            dto.setStartDate(tt != null ? tt.getStartDate() : null);
            dto.setEndDate(tt != null ? tt.getEndDate() : null);
            return dto;
        }).toList();
    }

    @Override
    public LessonTimelineLessonDto updateLesson(Long lessonId, UpdateTimelineRequestDto request) {
        Lesson lesson = lessonRepository.findById(lessonId).orElseThrow(NotFoundException::new);
        schoolGuard.schoolIdForWrite(CurrentUserHolder.get(), lesson.getSchoolId());

        validateRange(request.getStartDate(), request.getEndDate(), "Lesson");

        LessonTimeline timeline = lessonTimelineRepository.findByLesson_Id(lessonId).orElseGet(LessonTimeline::new);
        timeline.setLesson(lesson);
        timeline.setStartDate(request.getStartDate());
        timeline.setEndDate(request.getEndDate());
        lessonTimelineRepository.save(timeline);

        LessonTimelineLessonDto dto = new LessonTimelineLessonDto();
        dto.setLessonId(lesson.getId());
        dto.setLessonName(lesson.getLesson());
        dto.setStartDate(timeline.getStartDate());
        dto.setEndDate(timeline.getEndDate());
        return dto;
    }

    @Override
    public LessonTimelineTopicDto updateTopic(Long topicId, UpdateTimelineRequestDto request) {
        Topic topic = topicRepository.findById(topicId).orElseThrow(NotFoundException::new);
        schoolGuard.schoolIdForWrite(CurrentUserHolder.get(), topic.getSchoolId());

        validateRange(request.getStartDate(), request.getEndDate(), "Topic");

        Lesson lesson = topic.getLesson();
        if (lesson == null || lesson.getId() == null) throw new BadRequestException("Topic has no lesson");
        Optional<LessonTimeline> lessonTimelineOpt = lessonTimelineRepository.findByLesson_Id(lesson.getId());
        if (lessonTimelineOpt.isEmpty() || lessonTimelineOpt.get().getStartDate() == null || lessonTimelineOpt.get().getEndDate() == null) {
            throw new BadRequestException("Set lesson start and end date before setting topic dates");
        }

        LessonTimeline lessonTimeline = lessonTimelineOpt.get();
        ensureWithinLesson(request.getStartDate(), request.getEndDate(), lessonTimeline.getStartDate(), lessonTimeline.getEndDate());

        TopicTimeline timeline = topicTimelineRepository.findByTopic_Id(topicId).orElseGet(TopicTimeline::new);
        timeline.setTopic(topic);
        timeline.setStartDate(request.getStartDate());
        timeline.setEndDate(request.getEndDate());
        topicTimelineRepository.save(timeline);

        LessonTimelineTopicDto dto = new LessonTimelineTopicDto();
        dto.setTopicId(topic.getId());
        dto.setTopicName(topic.getTopic());
        dto.setStartDate(timeline.getStartDate());
        dto.setEndDate(timeline.getEndDate());
        return dto;
    }

    @Override
    public List<LessonPlanRowDto> planView(Long schoolId, String academicYear, Long classId, Long subjectId) {
        if (schoolId == null || classId == null || academicYear == null || academicYear.isBlank()) {
            throw new BadRequestException("schoolId, academicYear and classId are required");
        }
        Long effectiveSchoolId = schoolGuard.schoolIdForRead(CurrentUserHolder.get(), schoolId);

        List<Lesson> lessons = lessonRepository.search(effectiveSchoolId, academicYear, classId, subjectId).stream()
                .sorted(Comparator.comparing(l -> String.valueOf(l.getLesson()), String.CASE_INSENSITIVE_ORDER))
                .toList();
        List<Long> lessonIds = lessons.stream().map(Lesson::getId).filter(id -> id != null).toList();

        Map<Long, LessonTimeline> lessonTimelineByLessonId = new HashMap<>();
        if (!lessonIds.isEmpty()) {
            for (LessonTimeline lt : lessonTimelineRepository.findByLesson_IdIn(lessonIds)) {
                Lesson l = lt.getLesson();
                if (l != null && l.getId() != null) lessonTimelineByLessonId.put(l.getId(), lt);
            }
        }

        List<Topic> topics = topicRepository.search(effectiveSchoolId, academicYear, classId, subjectId, null);
        Map<Long, List<Topic>> topicsByLessonId = topics.stream()
                .filter(t -> t.getLesson() != null && t.getLesson().getId() != null)
                .collect(Collectors.groupingBy(t -> t.getLesson().getId()));

        List<Long> topicIds = topics.stream().map(Topic::getId).filter(id -> id != null).toList();
        Map<Long, TopicTimeline> topicTimelineByTopicId = new HashMap<>();
        if (!topicIds.isEmpty()) {
            for (TopicTimeline tt : topicTimelineRepository.findByTopic_IdIn(topicIds)) {
                Topic t = tt.getTopic();
                if (t != null && t.getId() != null) topicTimelineByTopicId.put(t.getId(), tt);
            }
        }

        return lessons.stream().flatMap(l -> {
            LessonTimeline lt = lessonTimelineByLessonId.get(l.getId());
            List<Topic> lessonTopics = topicsByLessonId.getOrDefault(l.getId(), List.of()).stream()
                    .sorted(Comparator.comparing(t -> String.valueOf(t.getTopic()), String.CASE_INSENSITIVE_ORDER))
                    .toList();
            if (lessonTopics.isEmpty()) {
                LessonPlanRowDto row = new LessonPlanRowDto();
                row.setLessonId(l.getId());
                row.setLessonName(l.getLesson());
                row.setLessonStartDate(lt != null ? lt.getStartDate() : null);
                row.setLessonEndDate(lt != null ? lt.getEndDate() : null);
                return List.of(row).stream();
            }

            return lessonTopics.stream().map(t -> {
                TopicTimeline tt = topicTimelineByTopicId.get(t.getId());
                LessonPlanRowDto row = new LessonPlanRowDto();
                row.setLessonId(l.getId());
                row.setLessonName(l.getLesson());
                row.setLessonStartDate(lt != null ? lt.getStartDate() : null);
                row.setLessonEndDate(lt != null ? lt.getEndDate() : null);
                row.setTopicId(t.getId());
                row.setTopicName(t.getTopic());
                row.setTopicStartDate(tt != null ? tt.getStartDate() : null);
                row.setTopicEndDate(tt != null ? tt.getEndDate() : null);
                return row;
            });
        }).toList();
    }

    private void validateRange(LocalDate start, LocalDate end, String label) {
        if (start == null && end == null) return;
        if (start == null || end == null) throw new BadRequestException(label + " start and end date must both be set");
        if (end.isBefore(start)) throw new BadRequestException(label + " end date must be greater than or equal to start date");
    }

    private void ensureWithinLesson(LocalDate topicStart, LocalDate topicEnd, LocalDate lessonStart, LocalDate lessonEnd) {
        if (topicStart == null && topicEnd == null) return;
        if (topicStart == null || topicEnd == null) throw new BadRequestException("Topic start and end date must both be set");
        if (topicStart.isBefore(lessonStart) || topicEnd.isAfter(lessonEnd)) {
            throw new BadRequestException("Topic dates must fall within the lesson date range");
        }
    }
}
