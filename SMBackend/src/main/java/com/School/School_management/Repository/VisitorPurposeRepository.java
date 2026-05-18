package com.School.School_management.Repository;

import com.School.School_management.Entity.VisitorPurpose;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VisitorPurposeRepository extends JpaRepository<VisitorPurpose, Long> {
    List<VisitorPurpose> findBySchoolIdAndIsDeletedFalse(Long schoolId);

    Page<VisitorPurpose> findBySchoolIdAndIsDeletedFalseOrderByIdDesc(Long schoolId, Pageable pageable);

    Page<VisitorPurpose> findBySchoolIdAndIsDeletedFalseAndPurposeContainingIgnoreCaseOrderByIdDesc(Long schoolId, String purpose, Pageable pageable);
}
