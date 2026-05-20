package com.School.School_management.Repository;

import com.School.School_management.Entity.LeaveApplication;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LeaveApplicationRepository extends JpaRepository<LeaveApplication, Long> {
    List<LeaveApplication> findAllByOrderByIdDesc();

    List<LeaveApplication> findBySchool_IdOrderByIdDesc(Long schoolId);

    List<LeaveApplication> findBySchool_IdAndStatusIgnoreCaseOrderByIdDesc(Long schoolId, String status);

    List<LeaveApplication> findByStatusIgnoreCaseOrderByIdDesc(String status);

    @Query("""
            select la from LeaveApplication la
            where la.school.id = :schoolId
              and upper(la.status) = 'APPROVED'
              and upper(la.applicantType) = upper(:applicantType)
              and :date between la.leaveFrom and la.leaveTo
              and la.applicantId in :applicantIds
            order by la.id desc
            """)
    List<LeaveApplication> findApprovedCoverage(
            @Param("schoolId") Long schoolId,
            @Param("applicantType") String applicantType,
            @Param("date") LocalDate date,
            @Param("applicantIds") List<Long> applicantIds
    );
}
