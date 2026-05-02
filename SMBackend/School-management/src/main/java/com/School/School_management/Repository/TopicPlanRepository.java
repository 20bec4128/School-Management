package com.School.School_management.Repository;

import com.School.School_management.Entity.TopicPlan;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TopicPlanRepository extends JpaRepository<TopicPlan, Long> {
    Optional<TopicPlan> findByTopic_Id(Long topicId);
    List<TopicPlan> findByTopic_IdIn(List<Long> topicIds);
}

