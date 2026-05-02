package com.School.School_management.Dto;

public class LessonDto {

    private Long id;
    private Long schoolId;
    private String schoolName;
    private String academicYear;
    private Long classId;
    private String className;
    private Long subjectId;
    private String subjectName;
    private String lesson;
    private String note;

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

    public String getLesson() { return lesson; }
    public void setLesson(String lesson) { this.lesson = lesson; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}