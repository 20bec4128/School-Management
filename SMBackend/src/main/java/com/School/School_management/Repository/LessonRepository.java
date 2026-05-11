package com.School.School_management.Repository;

import com.School.School_management.Entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {

    List<Lesson> findBySchoolIdAndAcademicYearAndClassIdAndSubjectId(
            Long schoolId,
            String academicYear,
            Long classId,
            Long subjectId
    );

    @Query("""
            SELECT l
            FROM Lesson l
            WHERE (:schoolId IS NULL OR l.schoolId = :schoolId)
              AND (:academicYear IS NULL OR l.academicYear = :academicYear)
              AND (:classId IS NULL OR l.classId = :classId)
              AND (:subjectId IS NULL OR l.subjectId = :subjectId)
            """)
    List<Lesson> search(
            @Param("schoolId") Long schoolId,
            @Param("academicYear") String academicYear,
            @Param("classId") Long classId,
            @Param("subjectId") Long subjectId
    );
}
