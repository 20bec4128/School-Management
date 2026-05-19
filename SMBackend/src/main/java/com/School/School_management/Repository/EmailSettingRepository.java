package com.School.School_management.Repository;

import com.School.School_management.Entity.EmailSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EmailSettingRepository extends JpaRepository<EmailSetting, Long> {

    @Query("SELECT e FROM EmailSetting e WHERE " +
            "(:headOfficeId IS NULL OR e.headOfficeId = :headOfficeId) AND " +
            "(:schoolId IS NULL OR e.schoolId = :schoolId) " +
            "ORDER BY e.id DESC")
    List<EmailSetting> findByScope(@Param("headOfficeId") Long headOfficeId,
                                   @Param("schoolId") Long schoolId);
}
