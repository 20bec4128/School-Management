package com.School.School_management.Repository;

import com.School.School_management.Entity.Attendance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long>, JpaSpecificationExecutor<Attendance> {

    Optional<Attendance> findFirstBySchoolIdAndExamTermAndClassNameAndSectionNameAndSubjectNameAndRollNoAndAttendanceDate(
            Long schoolId,
            String examTerm,
            String className,
            String sectionName,
            String subjectName,
            String rollNo,
            java.time.LocalDate attendanceDate);
}
