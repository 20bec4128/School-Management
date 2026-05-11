package com.School.School_management.Dto;

public class SubmissionRequestDto {

    private Long schoolId;
    private Long classId;
    private Long sectionId;
    private Long studentId;
    private Long assignmentId;
    private String note;

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public Long getClassId() { return classId; }
    public void setClassId(Long classId) { this.classId = classId; }

    public Long getSectionId() { return sectionId; }
    public void setSectionId(Long sectionId) { this.sectionId = sectionId; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public Long getAssignmentId() { return assignmentId; }
    public void setAssignmentId(Long assignmentId) { this.assignmentId = assignmentId; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}