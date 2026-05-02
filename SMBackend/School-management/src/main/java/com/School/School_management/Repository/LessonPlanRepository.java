package com.School.School_management.Repository;

import com.School.School_management.Entity.LessonPlan;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LessonPlanRepository extends JpaRepository<LessonPlan, Long> {
    Optional<LessonPlan> findByLesson_Id(Long lessonId);
    List<LessonPlan> findByLesson_IdIn(List<Long> lessonIds);
}

