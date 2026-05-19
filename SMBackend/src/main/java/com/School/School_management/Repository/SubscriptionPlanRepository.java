package com.School.School_management.Repository;

import com.School.School_management.Entity.SubscriptionPlan;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {
    List<SubscriptionPlan> findAllByDeletedFalseOrderByIdDesc();
    Optional<SubscriptionPlan> findByIdAndDeletedFalse(Long id);
}
