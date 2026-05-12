package com.School.School_management.Repository;

import com.School.School_management.Entity.ClassRoutine;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClassRoutineRepository extends JpaRepository<ClassRoutine, Long> {

    List<ClassRoutine> findBySchoolId(Long schoolId);

    List<ClassRoutine> findAllByOrderByIdDesc();

    List<ClassRoutine> findBySchoolIdOrderByIdDesc(Long schoolId);

    Optional<ClassRoutine> findByIdAndSchoolId(Long id, Long schoolId);

    boolean existsBySchoolIdAndClassIdAndSectionIdAndDayAndStartTimeAndEndTime(
            Long schoolId,
            Long classId,
            Long sectionId,
            String day,
            LocalTime startTime,
            LocalTime endTime
    );

    boolean existsBySchoolIdAndClassIdAndSectionIdAndDayAndStartTimeAndEndTimeAndIdNot(
            Long schoolId,
            Long classId,
            Long sectionId,
            String day,
            LocalTime startTime,
            LocalTime endTime,
            Long id
    );
}
