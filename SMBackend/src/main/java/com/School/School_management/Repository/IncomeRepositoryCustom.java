package com.School.School_management.Repository;

import com.School.School_management.Entity.Income;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface IncomeRepositoryCustom {
    List<Income> findAllActiveWithDetailsOrderByIdDesc();
    List<Income> findBySchoolIdActiveWithDetailsOrderByIdDesc(Long schoolId);
    Page<Income> findPageWithDetails(Long schoolId, Long incomeHeadId, String incomeMethod, String search, Pageable pageable);
    Optional<Income> findByIdWithDetails(Long id);
}
