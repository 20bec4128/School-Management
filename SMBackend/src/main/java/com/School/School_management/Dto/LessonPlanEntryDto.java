package com.School.School_management.Dto;

import java.time.LocalDate;

public class LessonPlanEntryDto {

    private Long id;

    private Long schoolId;
    private String schoolName;

    private String academicYear;

    private Long classId;
    private String className;

    private Long subjectId;
    private String subjectName;

    private Long lessonId;
    private String lesson;

    private Long topicId;
    private String topic;

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

    public String getSchoolName() { return schoolName; }
    public void setSchoolName(String schoolName) { this.schoolName = schoolName; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public Long getClassId() { return classId; }
    public void setClassId(Long classId) { this.classId = classId; }

    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }

    public String getLesson() { return lesson; }
    public void setLesson(String lesson) { this.lesson = lesson; }

    public Long getTopicId() { return topicId; }
    public void setTopicId(Long topicId) { this.topicId = topicId; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

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

