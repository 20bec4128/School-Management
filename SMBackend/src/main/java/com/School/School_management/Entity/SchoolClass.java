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
@Table(name = "classes")
public class SchoolClass {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "school_id", nullable = false)
  private ManageSchool school;

  private String className;
  private String numericName;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "teacher_id", nullable = true)
  private ManageTeacher classTeacher;

  @Column(columnDefinition = "TEXT")
  private String note;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public ManageSchool getSchool() {
    return school;
  }

  public void setSchool(ManageSchool school) {
    this.school = school;
  }

  public String getClassName() {
    return className;
  }

  public void setClassName(String className) {
    this.className = className;
  }

  public String getNumericName() {
    return numericName;
  }

  public void setNumericName(String numericName) {
    this.numericName = numericName;
  }

  public ManageTeacher getClassTeacher() {
    return classTeacher;
  }

  public void setClassTeacher(ManageTeacher classTeacher) {
    this.classTeacher = classTeacher;
  }

  public String getNote() {
    return note;
  }

  public void setNote(String note) {
    this.note = note;
  }
}

