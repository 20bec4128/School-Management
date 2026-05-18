package com.School.School_management.Repository;

import com.School.School_management.Entity.Schedule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    List<Schedule> findBySchoolId(Long schoolId);

    @Query("SELECT s FROM Schedule s WHERE s.schoolId = :schoolId AND (" +
           "LOWER(s.examTerm) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.className) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.subjectName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.roomNo) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Schedule> findBySchoolIdWithSearch(@Param("schoolId") Long schoolId, 
                                            @Param("search") String search, 
                                            Pageable pageable);

    Page<Schedule> findBySchoolId(Long schoolId, Pageable pageable);
}