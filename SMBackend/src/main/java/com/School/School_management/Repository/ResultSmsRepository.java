package com.School.School_management.Repository;

import com.School.School_management.Entity.ResultSms;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResultSmsRepository extends JpaRepository<ResultSms, Long> {

    @Query("SELECT r FROM ResultSms r WHERE " +
           "(:headOfficeId IS NULL OR r.headOfficeId = :headOfficeId) AND " +
           "(:schoolId IS NULL OR r.schoolId = :schoolId) " +
           "ORDER BY r.sendDate DESC, r.id DESC")
    List<ResultSms> findByScope(@Param("headOfficeId") Long headOfficeId, 
                                @Param("schoolId") Long schoolId);

    @Query("SELECT r FROM ResultSms r WHERE " +
           "(:headOfficeId IS NULL OR r.headOfficeId = :headOfficeId) AND " +
           "(:schoolId IS NULL OR r.schoolId = :schoolId) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(r.schoolName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(r.examTerm) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(r.receiverType) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(r.receiver) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(r.subject) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<ResultSms> findByScopeWithSearch(@Param("headOfficeId") Long headOfficeId, 
                                          @Param("schoolId") Long schoolId, 
                                          @Param("search") String search, 
                                          Pageable pageable);
}
