package com.School.School_management.Repository;

import com.School.School_management.Entity.SalaryPayment;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SalaryPaymentRepository extends JpaRepository<SalaryPayment, Long> {
    List<SalaryPayment> findAllByDeletedFalseOrderByIdDesc();
    List<SalaryPayment> findBySchoolIdAndDeletedFalseOrderByIdDesc(Long schoolId);
    List<SalaryPayment> findBySchoolIdInAndDeletedFalseOrderByIdDesc(Collection<Long> schoolIds);
    Optional<SalaryPayment> findByIdAndDeletedFalse(Long id);
}
