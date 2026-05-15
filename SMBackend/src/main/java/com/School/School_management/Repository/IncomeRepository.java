package com.School.School_management.Repository;

import com.School.School_management.Entity.Income;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncomeRepository extends JpaRepository<Income, Long>, IncomeRepositoryCustom {
    List<Income> findBySchool_IdAndDeletedFalseOrderByIdDesc(Long schoolId);
    List<Income> findAllByDeletedFalseOrderByIdDesc();
}
