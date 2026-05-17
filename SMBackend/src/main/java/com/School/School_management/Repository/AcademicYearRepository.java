package com.School.School_management.Repository;

import com.School.School_management.Entity.AcademicYear;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AcademicYearRepository extends JpaRepository<AcademicYear, Long> {
    List<AcademicYear> findBySchoolIdOrderBySessionStartDesc(Long schoolId);

    Page<AcademicYear> findBySchoolIdOrderBySessionStartDesc(Long schoolId, Pageable pageable);

    List<AcademicYear> findAllByOrderBySessionStartDesc();

    Page<AcademicYear> findAllByOrderBySessionStartDesc(Pageable pageable);

    @Query("select a from AcademicYear a where a.schoolId in :schoolIds order by a.sessionStart desc, a.id desc")
    Page<AcademicYear> findBySchoolIdInOrderBySessionStartDesc(@Param("schoolIds") Collection<Long> schoolIds, Pageable pageable);

    @Query("""
            select a from AcademicYear a
            where a.schoolId = :schoolId
              and (:running is null or a.isRunning = :running)
              and (
                :search is null
                or lower(a.academicYear) like lower(concat('%', :search, '%'))
                or lower(coalesce(a.note, '')) like lower(concat('%', :search, '%'))
              )
            order by a.sessionStart desc, a.id desc
            """)
    Page<AcademicYear> searchBySchoolId(
            @Param("schoolId") Long schoolId,
            @Param("running") Boolean running,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("""
            select a from AcademicYear a
            where a.schoolId in :schoolIds
              and (:running is null or a.isRunning = :running)
              and (
                :search is null
                or lower(a.academicYear) like lower(concat('%', :search, '%'))
                or lower(coalesce(a.note, '')) like lower(concat('%', :search, '%'))
              )
            order by a.sessionStart desc, a.id desc
            """)
    Page<AcademicYear> searchBySchoolIds(
            @Param("schoolIds") Collection<Long> schoolIds,
            @Param("running") Boolean running,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<AcademicYear> findByIdAndSchoolId(Long id, Long schoolId);

    boolean existsBySchoolIdAndAcademicYearIgnoreCase(Long schoolId, String academicYear);

    boolean existsBySchoolIdAndAcademicYearIgnoreCaseAndIdNot(Long schoolId, String academicYear, Long id);

    @Modifying
    @Query("update AcademicYear a set a.isRunning = false where a.schoolId = :schoolId and a.id <> :id")
    int clearRunningFlagForSchool(@Param("schoolId") Long schoolId, @Param("id") Long id);
}
