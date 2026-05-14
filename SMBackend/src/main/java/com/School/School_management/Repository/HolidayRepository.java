package com.School.School_management.Repository;

import com.School.School_management.Entity.Holiday;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, Long> {
    List<Holiday> findAllByIsDeletedFalseOrderByIdDesc();
    List<Holiday> findBySchoolIdAndIsDeletedFalseOrderByIdDesc(Long schoolId);
}
