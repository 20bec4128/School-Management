package com.School.School_management.Repository;

import com.School.School_management.Entity.SchoolSubscription;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SchoolSubscriptionRepository extends JpaRepository<SchoolSubscription, Long> {
    List<SchoolSubscription> findAllByDeletedFalseOrderByIdDesc();
    List<SchoolSubscription> findBySchoolIdAndDeletedFalseOrderByIdDesc(Long schoolId);
    Optional<SchoolSubscription> findFirstBySchoolIdAndDeletedFalseOrderByIdDesc(Long schoolId);
    List<SchoolSubscription> findBySchoolIdInAndDeletedFalseOrderByIdDesc(Collection<Long> schoolIds);
    Optional<SchoolSubscription> findByIdAndDeletedFalse(Long id);
}
