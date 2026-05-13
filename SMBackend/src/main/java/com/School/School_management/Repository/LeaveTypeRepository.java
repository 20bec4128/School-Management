package com.School.School_management.Repository;

import com.School.School_management.Entity.LeaveType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LeaveTypeRepository extends JpaRepository<LeaveType, Long> {

    List<LeaveType> findAllByOrderByIdDesc();

    List<LeaveType> findBySchoolIdOrderByIdDesc(Long schoolId);

    boolean existsBySchoolIdAndApplicantTypeIgnoreCaseAndDesignationIdAndLeaveTypeIgnoreCase(
            Long schoolId,
            String applicantType,
            Long designationId,
            String leaveType
    );

    boolean existsBySchoolIdAndApplicantTypeIgnoreCaseAndDesignationIdAndLeaveTypeIgnoreCaseAndIdNot(
            Long schoolId,
            String applicantType,
            Long designationId,
            String leaveType,
            Long id
    );
}
