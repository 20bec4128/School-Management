package com.School.School_management.Dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ClassLectureDto {

  private Long id;
  private String school;
  private String title;
  private String className;
  private String section;
  private String subject;
  private String classLecture;
  private String academicYear;
  private String lectureUrl;
  private String note;
  private Long lessonId;
  private String lesson;
  private Long teacherId;
  private String teacher;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getSchool() {
    return school;
  }

  public void setSchool(String school) {
    this.school = school;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  @JsonProperty("class")
  public String getClassName() {
    return className;
  }

  @JsonProperty("class")
  public void setClassName(String className) {
    this.className = className;
  }

  public String getSection() {
    return section;
  }

  public void setSection(String section) {
    this.section = section;
  }

  public String getSubject() {
    return subject;
  }

  public void setSubject(String subject) {
    this.subject = subject;
  }

  public String getClassLecture() {
    return classLecture;
  }

  public void setClassLecture(String classLecture) {
    this.classLecture = classLecture;
  }

  public String getAcademicYear() {
    return academicYear;
  }

  public void setAcademicYear(String academicYear) {
    this.academicYear = academicYear;
  }

  public String getLectureUrl() {
    return lectureUrl;
  }

  public void setLectureUrl(String lectureUrl) {
    this.lectureUrl = lectureUrl;
  }

  public String getNote() {
    return note;
  }

  public void setNote(String note) {
    this.note = note;
  }

  public Long getLessonId() {
    return lessonId;
  }

  public void setLessonId(Long lessonId) {
    this.lessonId = lessonId;
  }

  public String getLesson() {
    return lesson;
  }

  public void setLesson(String lesson) {
    this.lesson = lesson;
  }

  public Long getTeacherId() {
    return teacherId;
  }

  public void setTeacherId(Long teacherId) {
    this.teacherId = teacherId;
  }

  public String getTeacher() {
    return teacher;
  }

  public void setTeacher(String teacher) {
    this.teacher = teacher;
  }
}

