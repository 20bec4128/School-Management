package com.School.School_management.Repository;

import com.School.School_management.Entity.AcademicYear;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AcademicYearRepository extends JpaRepository<AcademicYear, Long> {
    List<AcademicYear> findBySchoolIdOrderBySessionStartDesc(Long schoolId);

    List<AcademicYear> findAllByOrderBySessionStartDesc();

    Optional<AcademicYear> findByIdAndSchoolId(Long id, Long schoolId);

    boolean existsBySchoolIdAndAcademicYearIgnoreCase(Long schoolId, String academicYear);

    boolean existsBySchoolIdAndAcademicYearIgnoreCaseAndIdNot(Long schoolId, String academicYear, Long id);

    @Modifying
    @Query("update AcademicYear a set a.isRunning = false where a.schoolId = :schoolId and a.id <> :id")
    int clearRunningFlagForSchool(@Param("schoolId") Long schoolId, @Param("id") Long id);
}
