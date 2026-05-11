package com.School.School_management.Repository;

import com.School.School_management.Entity.LessonTimeline;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LessonTimelineRepository extends JpaRepository<LessonTimeline, Long> {
    Optional<LessonTimeline> findByLesson_Id(Long lessonId);
    List<LessonTimeline> findByLesson_IdIn(List<Long> lessonIds);
}

