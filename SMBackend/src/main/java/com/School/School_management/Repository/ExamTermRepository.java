package com.School.School_management.Repository;

import com.School.School_management.Entity.ExamTerm;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ExamTermRepository extends JpaRepository<ExamTerm, Long> {

    List<ExamTerm> findBySchoolIdOrderByIdDesc(Long schoolId);

    Page<ExamTerm> findBySchoolIdOrderByIdDesc(Long schoolId, Pageable pageable);

    List<ExamTerm> findAllByOrderByIdDesc();

    boolean existsBySchoolIdAndGradeNameIgnoreCase(Long schoolId, String gradeName);

    boolean existsBySchoolIdAndGradeNameIgnoreCaseAndIdNot(Long schoolId, String gradeName, Long id);

    @Query("SELECT e FROM ExamTerm e WHERE e.schoolId = :schoolId " +
            "AND (:search IS NULL OR LOWER(e.gradeName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(CAST(e.gradePoint AS string), '')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(e.note, '')) LIKE LOWER(CONCAT('%', :search, '%'))) ")
    Page<ExamTerm> searchExamTerms(@Param("schoolId") Long schoolId, @Param("search") String search, Pageable pageable);
}
