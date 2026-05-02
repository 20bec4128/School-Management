package com.School.School_management.Repository;

import com.School.School_management.Entity.Topic;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TopicRepository extends JpaRepository<Topic, Long> {

    @Query("""
            SELECT t
            FROM Topic t
            WHERE (:schoolId IS NULL OR t.schoolId = :schoolId)
              AND (:academicYear IS NULL OR t.academicYear = :academicYear)
              AND (:classId IS NULL OR t.classId = :classId)
              AND (:subjectId IS NULL OR t.subjectId = :subjectId)
              AND (:lessonId IS NULL OR t.lesson.id = :lessonId)
            """)
    List<Topic> search(
            @Param("schoolId") Long schoolId,
            @Param("academicYear") String academicYear,
            @Param("classId") Long classId,
            @Param("subjectId") Long subjectId,
            @Param("lessonId") Long lessonId
    );
}

