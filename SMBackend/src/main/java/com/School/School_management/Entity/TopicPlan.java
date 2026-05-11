package com.School.School_management.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "topic_plan")
public class TopicPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "topic_id", nullable = false, unique = true)
    private Topic topic;

    @Enumerated(EnumType.STRING)
    @Column(name = "topic_status", nullable = false, length = 30)
    private LessonProgressStatus topicStatus = LessonProgressStatus.YET_TO_START;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Topic getTopic() { return topic; }
    public void setTopic(Topic topic) { this.topic = topic; }

    public LessonProgressStatus getTopicStatus() { return topicStatus; }
    public void setTopicStatus(LessonProgressStatus topicStatus) { this.topicStatus = topicStatus; }
}

