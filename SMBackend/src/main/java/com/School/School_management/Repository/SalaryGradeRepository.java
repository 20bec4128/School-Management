package com.School.School_management.Repository;

import com.School.School_management.Entity.SalaryGrade;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SalaryGradeRepository extends JpaRepository<SalaryGrade, Long> {

    List<SalaryGrade> findBySchoolIdOrderByIdDesc(Long schoolId);

    Page<SalaryGrade> findBySchoolIdOrderByIdDesc(Long schoolId, Pageable pageable);

    @Query("SELECT s FROM SalaryGrade s WHERE s.schoolId = :schoolId " +
           "AND (:search IS NULL OR LOWER(s.gradeName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<SalaryGrade> searchSalaryGrades(@Param("schoolId") Long schoolId, @Param("search") String search, Pageable pageable);

    List<SalaryGrade> findAllByOrderByIdDesc();

    boolean existsBySchoolIdAndGradeNameIgnoreCase(Long schoolId, String gradeName);

    boolean existsBySchoolIdAndGradeNameIgnoreCaseAndIdNot(Long schoolId, String gradeName, Long id);
}
