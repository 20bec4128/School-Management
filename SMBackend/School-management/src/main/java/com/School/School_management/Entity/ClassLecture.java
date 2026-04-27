package com.School.School_management.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "class_lectures")
public class ClassLecture {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String school;
  private String title;

  @Column(name = "class_name")
  private String className;

  private String section;
  private String subject;

  private String classLecture;

  private String academicYear;

  private String lectureUrl;

  @Column(columnDefinition = "TEXT")
  private String note;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "teacher_id", nullable = false)
  private ManageTeacher teacher;

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

  public String getClassName() {
    return className;
  }

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

  public ManageTeacher getTeacher() {
    return teacher;
  }

  public void setTeacher(ManageTeacher teacher) {
    this.teacher = teacher;
  }
}

