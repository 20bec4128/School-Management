package com.School.School_management.Repository;

import com.School.School_management.Entity.LessonPlanEntry;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LessonPlanEntryRepository extends JpaRepository<LessonPlanEntry, Long> {

    @Query("""
            SELECT e
            FROM LessonPlanEntry e
            WHERE (:schoolId IS NULL OR e.schoolId = :schoolId)
              AND (:academicYear IS NULL OR e.academicYear = :academicYear)
              AND (:classId IS NULL OR e.classId = :classId)
              AND (:subjectId IS NULL OR e.subjectId = :subjectId)
              AND (:lessonId IS NULL OR e.lesson.id = :lessonId)
              AND (:topicId IS NULL OR (e.topic IS NOT NULL AND e.topic.id = :topicId))
            """)
    List<LessonPlanEntry> search(
            @Param("schoolId") Long schoolId,
            @Param("academicYear") String academicYear,
            @Param("classId") Long classId,
            @Param("subjectId") Long subjectId,
            @Param("lessonId") Long lessonId,
            @Param("topicId") Long topicId
    );
}

