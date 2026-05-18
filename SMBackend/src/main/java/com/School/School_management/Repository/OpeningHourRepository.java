package com.School.School_management.Repository;

import com.School.School_management.Entity.OpeningHour;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OpeningHourRepository extends JpaRepository<OpeningHour, Long> {

    @Query("SELECT oh FROM OpeningHour oh WHERE (:schoolId IS NULL OR oh.schoolId = :schoolId)")
    Page<OpeningHour> searchOpeningHours(
            @Param("schoolId") Long schoolId,
            Pageable pageable
    );
}
