package com.School.School_management.Repository;

import com.School.School_management.Entity.FeeCollection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface FeeCollectionRepositoryCustom {
    List<FeeCollection> findAllActiveWithDetailsOrderByIdDesc();
    List<FeeCollection> findBySchoolIdActiveWithDetailsOrderByIdDesc(Long schoolId);
    Page<FeeCollection> findPageWithDetails(Long schoolId, Long classId, Long feeTypeId, String status, String month, String search, Pageable pageable);
    Optional<FeeCollection> findByIdWithDetails(Long id);
}
