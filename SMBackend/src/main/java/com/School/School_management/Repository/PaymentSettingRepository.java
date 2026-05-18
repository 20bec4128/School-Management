package com.School.School_management.Repository;

import com.School.School_management.Entity.PaymentSetting;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentSettingRepository extends JpaRepository<PaymentSetting, Long> {

    @Query("SELECT p FROM PaymentSetting p WHERE " +
           "(:headOfficeId IS NULL OR p.headOfficeId = :headOfficeId) AND " +
           "(:schoolId IS NULL OR p.schoolId = :schoolId) " +
           "ORDER BY p.id DESC")
    List<PaymentSetting> findByScope(@Param("headOfficeId") Long headOfficeId, 
                                     @Param("schoolId") Long schoolId);

    @Query("SELECT p FROM PaymentSetting p WHERE " +
           "(:headOfficeId IS NULL OR p.headOfficeId = :headOfficeId) AND " +
           "(:schoolId IS NULL OR p.schoolId = :schoolId) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(p.schoolName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(p.gateway) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(p.paypalEmail) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<PaymentSetting> findByScopeWithSearch(@Param("headOfficeId") Long headOfficeId, 
                                               @Param("schoolId") Long schoolId, 
                                               @Param("search") String search, 
                                               Pageable pageable);
}
