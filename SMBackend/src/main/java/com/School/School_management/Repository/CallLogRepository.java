package com.School.School_management.Repository;

import com.School.School_management.Entity.CallLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CallLogRepository extends JpaRepository<CallLog, Long> {
    List<CallLog> findBySchoolIdAndIsDeletedFalse(Long schoolId);
}
