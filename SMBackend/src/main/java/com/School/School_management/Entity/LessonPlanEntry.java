package com.School.School_management.Entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "lesson_plan_entries")
public class LessonPlanEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long schoolId;
    private String academicYear;

    private Long classId;
    private Long subjectId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id")
    private Topic topic;

    private LocalDate lessonStartDate;
    private LocalDate lessonEndDate;
    private String lessonStatus;

    private LocalDate topicStartDate;
    private LocalDate topicEndDate;
    private String topicStatus;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public Long getClassId() { return classId; }
    public void setClassId(Long classId) { this.classId = classId; }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }

    public Lesson getLesson() { return lesson; }
    public void setLesson(Lesson lesson) { this.lesson = lesson; }

    public Topic getTopic() { return topic; }
    public void setTopic(Topic topic) { this.topic = topic; }

    public LocalDate getLessonStartDate() { return lessonStartDate; }
    public void setLessonStartDate(LocalDate lessonStartDate) { this.lessonStartDate = lessonStartDate; }

    public LocalDate getLessonEndDate() { return lessonEndDate; }
    public void setLessonEndDate(LocalDate lessonEndDate) { this.lessonEndDate = lessonEndDate; }

    public String getLessonStatus() { return lessonStatus; }
    public void setLessonStatus(String lessonStatus) { this.lessonStatus = lessonStatus; }

    public LocalDate getTopicStartDate() { return topicStartDate; }
    public void setTopicStartDate(LocalDate topicStartDate) { this.topicStartDate = topicStartDate; }

    public LocalDate getTopicEndDate() { return topicEndDate; }
    public void setTopicEndDate(LocalDate topicEndDate) { this.topicEndDate = topicEndDate; }

    public String getTopicStatus() { return topicStatus; }
    public void setTopicStatus(String topicStatus) { this.topicStatus = topicStatus; }
}

