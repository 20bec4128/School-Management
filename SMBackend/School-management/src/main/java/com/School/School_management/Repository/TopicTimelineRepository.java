package com.School.School_management.Repository;

import com.School.School_management.Entity.TopicTimeline;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TopicTimelineRepository extends JpaRepository<TopicTimeline, Long> {
    Optional<TopicTimeline> findByTopic_Id(Long topicId);
    List<TopicTimeline> findByTopic_IdIn(List<Long> topicIds);
}

