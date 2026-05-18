package com.School.School_management.Repository;

import com.School.School_management.Entity.SmsSetting;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SmsSettingRepository extends JpaRepository<SmsSetting, Long> {

    @Query("SELECT s FROM SmsSetting s WHERE " +
           "(:headOfficeId IS NULL OR s.headOfficeId = :headOfficeId) AND " +
           "(:schoolId IS NULL OR s.schoolId = :schoolId) " +
           "ORDER BY s.id DESC")
    List<SmsSetting> findByScope(@Param("headOfficeId") Long headOfficeId, 
                                 @Param("schoolId") Long schoolId);

    @Query("SELECT s FROM SmsSetting s WHERE " +
           "(:headOfficeId IS NULL OR s.headOfficeId = :headOfficeId) AND " +
           "(:schoolId IS NULL OR s.schoolId = :schoolId) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(s.schoolName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(s.gateway) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(s.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(s.accountSid) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<SmsSetting> findByScopeWithSearch(@Param("headOfficeId") Long headOfficeId, 
                                           @Param("schoolId") Long schoolId, 
                                           @Param("search") String search, 
                                           Pageable pageable);
}
