package com.School.School_management.Repository;

import com.School.School_management.Entity.Expenditure;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExpenditureRepository extends JpaRepository<Expenditure, Long>, ExpenditureRepositoryCustom {
    List<Expenditure> findBySchool_IdAndDeletedFalseOrderByIdDesc(Long schoolId);
    List<Expenditure> findAllByDeletedFalseOrderByIdDesc();
}
