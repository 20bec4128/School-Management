package com.School.School_management.Repository;

import com.School.School_management.Entity.GeneralSetting;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GeneralSettingRepository extends JpaRepository<GeneralSetting, Long> {

    @Query("SELECT g FROM GeneralSetting g WHERE " +
           "(:headOfficeId IS NULL OR g.headOfficeId = :headOfficeId) AND " +
           "(:schoolId IS NULL OR g.schoolId = :schoolId) " +
           "ORDER BY g.id DESC")
    List<GeneralSetting> findByScope(@Param("headOfficeId") Long headOfficeId, 
                                     @Param("schoolId") Long schoolId);

    @Query("SELECT g FROM GeneralSetting g WHERE " +
           "(:headOfficeId IS NULL OR g.headOfficeId = :headOfficeId) AND " +
           "(:schoolId IS NULL OR g.schoolId = :schoolId) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(g.schoolName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(g.brandName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(g.brandTitle) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<GeneralSetting> findByScopeWithSearch(@Param("headOfficeId") Long headOfficeId, 
                                               @Param("schoolId") Long schoolId, 
                                               @Param("search") String search, 
                                               Pageable pageable);

    Optional<GeneralSetting> findBySchoolId(Long schoolId);
}
