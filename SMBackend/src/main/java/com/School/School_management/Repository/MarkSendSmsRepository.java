package com.School.School_management.Repository;

import com.School.School_management.Entity.MarkSendSms;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarkSendSmsRepository extends JpaRepository<MarkSendSms, Long> {

    @Query("SELECT m FROM MarkSendSms m WHERE " +
           "(:headOfficeId IS NULL OR m.headOfficeId = :headOfficeId) AND " +
           "(:schoolId IS NULL OR m.schoolId = :schoolId) " +
           "ORDER BY m.sendDate DESC, m.id DESC")
    List<MarkSendSms> findByScope(@Param("headOfficeId") Long headOfficeId, 
                                  @Param("schoolId") Long schoolId);

    @Query("SELECT m FROM MarkSendSms m WHERE " +
           "(:headOfficeId IS NULL OR m.headOfficeId = :headOfficeId) AND " +
           "(:schoolId IS NULL OR m.schoolId = :schoolId) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(m.schoolName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(m.examTerm) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(m.receiverType) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(m.receiver) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(m.gateway) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(m.sms) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<MarkSendSms> findByScopeWithSearch(@Param("headOfficeId") Long headOfficeId, 
                                            @Param("schoolId") Long schoolId, 
                                            @Param("search") String search, 
                                            Pageable pageable);
}