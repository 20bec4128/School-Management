package com.School.School_management.Repository;

import com.School.School_management.Entity.ExamGrade;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ExamGradeRepository extends JpaRepository<ExamGrade, Long> {

    List<ExamGrade> findBySchoolIdOrderByIdDesc(Long schoolId);

    Page<ExamGrade> findBySchoolIdOrderByIdDesc(Long schoolId, Pageable pageable);

    List<ExamGrade> findAllByOrderByIdDesc();

    boolean existsBySchoolIdAndGradeNameIgnoreCase(Long schoolId, String gradeName);

    boolean existsBySchoolIdAndGradeNameIgnoreCaseAndIdNot(Long schoolId, String gradeName, Long id);

    @Query("SELECT e FROM ExamGrade e WHERE e.schoolId = :schoolId " +
            "AND (:search IS NULL OR LOWER(e.gradeName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(CAST(e.gradePoint AS string), '')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(e.note, '')) LIKE LOWER(CONCAT('%', :search, '%'))) ")
    Page<ExamGrade> searchExamGrades(@Param("schoolId") Long schoolId, @Param("search") String search, Pageable pageable);
}
