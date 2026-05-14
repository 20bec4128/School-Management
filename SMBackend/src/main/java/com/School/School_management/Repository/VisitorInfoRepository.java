package com.School.School_management.Repository;

import com.School.School_management.Entity.VisitorInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VisitorInfoRepository extends JpaRepository<VisitorInfo, Long> {
    List<VisitorInfo> findBySchoolIdAndIsDeletedFalse(Long schoolId);
}
