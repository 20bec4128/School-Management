package com.School.School_management.Repository;

import com.School.School_management.Entity.ExpenditureHead;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ExpenditureHeadRepositoryCustom {
    List<ExpenditureHead> findAllActiveWithDetailsOrderByIdDesc();
    List<ExpenditureHead> findBySchoolIdActiveWithDetailsOrderByIdDesc(Long schoolId);
    Page<ExpenditureHead> findPageWithDetails(Long schoolId, String search, Pageable pageable);
    Optional<ExpenditureHead> findByIdWithDetails(Long id);
}
