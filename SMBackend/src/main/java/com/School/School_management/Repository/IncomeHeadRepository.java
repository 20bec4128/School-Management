package com.School.School_management.Repository;

import com.School.School_management.Entity.IncomeHead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncomeHeadRepository extends JpaRepository<IncomeHead, Long>, IncomeHeadRepositoryCustom {
    List<IncomeHead> findBySchool_IdAndDeletedFalseOrderByIdDesc(Long schoolId);
    List<IncomeHead> findAllByDeletedFalseOrderByIdDesc();
}
