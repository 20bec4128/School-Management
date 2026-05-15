package com.School.School_management.Repository;

import com.School.School_management.Entity.IncomeHead;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface IncomeHeadRepositoryCustom {
    List<IncomeHead> findAllActiveWithDetailsOrderByIdDesc();
    List<IncomeHead> findBySchoolIdActiveWithDetailsOrderByIdDesc(Long schoolId);
    Page<IncomeHead> findPageWithDetails(Long schoolId, String search, Pageable pageable);
    Optional<IncomeHead> findByIdWithDetails(Long id);
}
