package com.School.School_management.Repository;

import com.School.School_management.Entity.ExpenditureHead;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExpenditureHeadRepository extends JpaRepository<ExpenditureHead, Long>, ExpenditureHeadRepositoryCustom {
    List<ExpenditureHead> findBySchool_IdAndDeletedFalseOrderByIdDesc(Long schoolId);
    List<ExpenditureHead> findAllByDeletedFalseOrderByIdDesc();
    boolean existsBySchool_IdAndExpenditureHeadIgnoreCaseAndDeletedFalse(Long schoolId, String expenditureHead);
    boolean existsBySchool_IdAndExpenditureHeadIgnoreCaseAndDeletedFalseAndIdNot(Long schoolId, String expenditureHead, Long id);
}
