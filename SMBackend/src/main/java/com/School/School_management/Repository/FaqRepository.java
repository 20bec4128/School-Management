package com.School.School_management.Repository;

import com.School.School_management.Entity.Faq;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FaqRepository extends JpaRepository<Faq, Long> {
    List<Faq> findAllByDeletedFalseOrderByIdDesc();
    List<Faq> findBySchoolIdAndDeletedFalseOrderByIdDesc(Long schoolId);
    List<Faq> findBySchoolIdInAndDeletedFalseOrderByIdDesc(Collection<Long> schoolIds);
    Optional<Faq> findByIdAndDeletedFalse(Long id);
}
