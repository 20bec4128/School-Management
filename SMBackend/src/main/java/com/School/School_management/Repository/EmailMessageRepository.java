package com.School.School_management.Repository;

import com.School.School_management.Entity.EmailMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailMessageRepository extends JpaRepository<EmailMessage, Long> {

    @Query("SELECT e FROM EmailMessage e WHERE " +
           "(:headOfficeId IS NULL OR e.headOfficeId = :headOfficeId) AND " +
           "(:schoolId IS NULL OR e.schoolId = :schoolId) AND " +
           "(:category IS NULL OR e.category = :category) " +
           "ORDER BY e.sendDate DESC, e.id DESC")
    List<EmailMessage> findByScope(@Param("headOfficeId") Long headOfficeId,
                                   @Param("schoolId") Long schoolId,
                                   @Param("category") String category);

    @Query("SELECT e FROM EmailMessage e WHERE " +
           "(:headOfficeId IS NULL OR e.headOfficeId = :headOfficeId) AND " +
           "(:schoolId IS NULL OR e.schoolId = :schoolId) AND " +
           "(:category IS NULL OR e.category = :category) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(COALESCE(e.schoolName, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(COALESCE(e.className, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(e.receiverType) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(e.receiver) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(e.subject) LIKE LOWER(CONCAT('%', :search, '%'))) ")
    Page<EmailMessage> findByScopeWithSearch(@Param("headOfficeId") Long headOfficeId,
                                             @Param("schoolId") Long schoolId,
                                             @Param("category") String category,
                                             @Param("search") String search,
                                             Pageable pageable);
}
