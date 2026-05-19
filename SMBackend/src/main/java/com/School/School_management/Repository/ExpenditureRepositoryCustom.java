package com.School.School_management.Repository;

import com.School.School_management.Entity.Expenditure;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ExpenditureRepositoryCustom {
    List<Expenditure> findAllActiveWithDetailsOrderByIdDesc();
    List<Expenditure> findBySchoolIdActiveWithDetailsOrderByIdDesc(Long schoolId);
    Page<Expenditure> findPageWithDetails(
            Long schoolId,
            Long expenditureHeadId,
            String expenditureMethod,
            LocalDate startDate,
            LocalDate endDate,
            String search,
            Pageable pageable
    );
    Optional<Expenditure> findByIdWithDetails(Long id);
}
