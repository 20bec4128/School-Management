package com.School.School_management.Repository;

import com.School.School_management.Entity.LeaveApplication;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LeaveApplicationRepository extends JpaRepository<LeaveApplication, Long> {
    List<LeaveApplication> findAllByOrderByIdDesc();

    List<LeaveApplication> findBySchool_IdOrderByIdDesc(Long schoolId);

    List<LeaveApplication> findBySchool_IdAndStatusIgnoreCaseOrderByIdDesc(Long schoolId, String status);

    List<LeaveApplication> findByStatusIgnoreCaseOrderByIdDesc(String status);
}
