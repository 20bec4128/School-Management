package com.School.School_management.Repository;

import com.School.School_management.Entity.AbsentEmailSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AbsentEmailSettingRepository extends JpaRepository<AbsentEmailSetting, Long> {

    Optional<AbsentEmailSetting> findBySchoolId(Long schoolId);

    @Query("SELECT s FROM AbsentEmailSetting s WHERE " +
            "(:headOfficeId IS NULL OR s.headOfficeId = :headOfficeId) AND " +
            "(:schoolId IS NULL OR s.schoolId = :schoolId) " +
            "ORDER BY s.id DESC")
    List<AbsentEmailSetting> findByScope(@Param("headOfficeId") Long headOfficeId,
                                         @Param("schoolId") Long schoolId);
}

