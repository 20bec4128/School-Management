package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.LessonStatusLessonDto;
import com.School.School_management.Dto.LessonStatusPageDataDto;
import com.School.School_management.Dto.LessonStatusTopicDto;
import com.School.School_management.Dto.UpdateLessonStatusRequest;
import com.School.School_management.Dto.UpdateStatusResponseDto;
import com.School.School_management.Dto.UpdateTopicStatusRequest;
import com.School.School_management.Entity.Lesson;
import com.School.School_management.Entity.LessonPlan;
import com.School.School_management.Entity.LessonProgressStatus;
import com.School.School_management.Entity.Topic;
import com.School.School_management.Entity.TopicPlan;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.LessonPlanRepository;
import com.School.School_management.Repository.LessonRepository;
import com.School.School_management.Repository.TopicPlanRepository;
import com.School.School_management.Repository.TopicRepository;
import com.School.School_management.Service.LessonStatusService;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.auth.SchoolGuard;
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
public class LessonStatusServiceImpl implements LessonStatusService {

    private final LessonRepository lessonRepository;
    private final TopicRepository topicRepository;
    private final LessonPlanRepository lessonPlanRepository;
    private final TopicPlanRepository topicPlanRepository;
    private final SchoolGuard schoolGuard;

    public LessonStatusServiceImpl(
            LessonRepository lessonRepository,
            TopicRepository topicRepository,
            LessonPlanRepository lessonPlanRepository,
            TopicPlanRepository topicPlanRepository,
            SchoolGuard schoolGuard
    ) {
        this.lessonRepository = lessonRepository;
        this.topicRepository = topicRepository;
        this.lessonPlanRepository = lessonPlanRepository;
        this.topicPlanRepository = topicPlanRepository;
        this.schoolGuard = schoolGuard;
    }

    @Override
    public LessonStatusPageDataDto pageData(Long schoolId, Long classId, Long subjectId, String academicYear) {
        if (schoolId == null || classId == null) {
            throw new BadRequestException("schoolId and classId are required");
        }

        Long effectiveSchoolId = schoolGuard.schoolIdForRead(CurrentUserHolder.get(), schoolId);

        List<Lesson> lessons = lessonRepository.search(effectiveSchoolId, academicYear, classId, subjectId);
        lessons = lessons.stream()
                .sorted(Comparator.comparing(l -> String.valueOf(l.getLesson()), String.CASE_INSENSITIVE_ORDER))
                .toList();

        List<Topic> topics = topicRepository.search(effectiveSchoolId, academicYear, classId, subjectId, null);
        Map<Long, List<Topic>> topicsByLessonId = topics.stream()
                .filter(t -> t.getLesson() != null && t.getLesson().getId() != null)
                .collect(Collectors.groupingBy(t -> t.getLesson().getId()));

        List<Long> topicIds = topics.stream().map(Topic::getId).filter(id -> id != null).toList();
        Map<Long, LessonProgressStatus> topicStatusByTopicId = new HashMap<>();
        if (!topicIds.isEmpty()) {
            for (TopicPlan tp : topicPlanRepository.findByTopic_IdIn(topicIds)) {
                Topic topic = tp.getTopic();
                if (topic != null && topic.getId() != null) {
                    topicStatusByTopicId.put(topic.getId(), Optional.ofNullable(tp.getTopicStatus()).orElse(LessonProgressStatus.YET_TO_START));
                }
            }
        }

        LessonStatusPageDataDto result = new LessonStatusPageDataDto();
        List<LessonStatusLessonDto> lessonDtos = lessons.stream().map(l -> {
            LessonStatusLessonDto dto = new LessonStatusLessonDto();
            dto.setLessonId(l.getId());
            dto.setLessonName(l.getLesson());

            List<TopicStatusRow> topicRows = topicsByLessonId.getOrDefault(l.getId(), List.of()).stream()
                    .sorted(Comparator.comparing(t -> String.valueOf(t.getTopic()), String.CASE_INSENSITIVE_ORDER))
                    .map(t -> new TopicStatusRow(t, topicStatusByTopicId.getOrDefault(t.getId(), LessonProgressStatus.YET_TO_START)))
                    .toList();

            List<LessonStatusTopicDto> topicDtos = topicRows.stream().map(r -> {
                LessonStatusTopicDto tDto = new LessonStatusTopicDto();
                tDto.setTopicId(r.topic.getId());
                tDto.setTopicName(r.topic.getTopic());
                tDto.setTopicStatus(r.status);
                return tDto;
            }).toList();
            dto.setTopics(topicDtos);
            dto.setLessonStatus(calculateLessonStatus(topicRows));
            return dto;
        }).toList();

        result.setLessons(lessonDtos);
        return result;
    }

    @Override
    public UpdateStatusResponseDto updateTopic(UpdateTopicStatusRequest request) {
        Topic topic = topicRepository.findById(request.getTopicId()).orElseThrow(NotFoundException::new);
        schoolGuard.schoolIdForWrite(CurrentUserHolder.get(), topic.getSchoolId());

        TopicPlan plan = topicPlanRepository.findByTopic_Id(topic.getId()).orElseGet(TopicPlan::new);
        plan.setTopic(topic);
        plan.setTopicStatus(request.getStatus());
        topicPlanRepository.save(plan);

        UpdateStatusResponseDto resp = new UpdateStatusResponseDto();
        resp.setTopicId(topic.getId());
        resp.setTopicStatus(request.getStatus());

        Lesson lesson = topic.getLesson();
        if (lesson != null && lesson.getId() != null) {
            LessonProgressStatus lessonStatus = calculateLessonStatusFromDb(lesson.getId(), topic.getSchoolId(), topic.getClassId(), topic.getSubjectId(), topic.getAcademicYear());
            upsertLessonStatus(lesson, lessonStatus);
            resp.setLessonId(lesson.getId());
            resp.setLessonStatus(lessonStatus);
        }

        return resp;
    }

    @Override
    public UpdateStatusResponseDto updateLesson(UpdateLessonStatusRequest request) {
        throw new BadRequestException("Lesson status is derived from topic statuses. Update topic statuses instead.");
    }

    private LessonProgressStatus upsertLessonStatus(Lesson lesson, LessonProgressStatus status) {
        LessonPlan plan = lessonPlanRepository.findByLesson_Id(lesson.getId()).orElseGet(LessonPlan::new);
        plan.setLesson(lesson);
        plan.setLessonStatus(status);
        lessonPlanRepository.save(plan);
        return status;
    }

    private LessonProgressStatus calculateLessonStatus(List<TopicStatusRow> topicRows) {
        if (topicRows == null || topicRows.isEmpty()) return LessonProgressStatus.YET_TO_START;
        boolean allCompleted = topicRows.stream().allMatch(r -> r.status == LessonProgressStatus.COMPLETED);
        if (allCompleted) return LessonProgressStatus.COMPLETED;
        boolean anyGoingOn = topicRows.stream().anyMatch(r -> r.status == LessonProgressStatus.GOING_ON);
        if (anyGoingOn) return LessonProgressStatus.GOING_ON;
        return LessonProgressStatus.YET_TO_START;
    }

    private LessonProgressStatus calculateLessonStatusFromDb(Long lessonId, Long schoolId, Long classId, Long subjectId, String academicYear) {
        List<Topic> topics = topicRepository.search(schoolId, academicYear, classId, subjectId, lessonId);
        if (topics.isEmpty()) return LessonProgressStatus.YET_TO_START;

        List<Long> topicIds = topics.stream().map(Topic::getId).filter(id -> id != null).toList();
        Map<Long, LessonProgressStatus> statusByTopicId = new HashMap<>();
        for (TopicPlan tp : topicPlanRepository.findByTopic_IdIn(topicIds)) {
            Topic t = tp.getTopic();
            if (t != null && t.getId() != null) {
                statusByTopicId.put(t.getId(), Optional.ofNullable(tp.getTopicStatus()).orElse(LessonProgressStatus.YET_TO_START));
            }
        }

        boolean allCompleted = true;
        boolean anyGoingOn = false;
        for (Long tid : topicIds) {
            LessonProgressStatus st = statusByTopicId.getOrDefault(tid, LessonProgressStatus.YET_TO_START);
            if (st != LessonProgressStatus.COMPLETED) allCompleted = false;
            if (st == LessonProgressStatus.GOING_ON) anyGoingOn = true;
        }
        if (allCompleted) return LessonProgressStatus.COMPLETED;
        if (anyGoingOn) return LessonProgressStatus.GOING_ON;
        return LessonProgressStatus.YET_TO_START;
    }

    private record TopicStatusRow(Topic topic, LessonProgressStatus status) {}
}
