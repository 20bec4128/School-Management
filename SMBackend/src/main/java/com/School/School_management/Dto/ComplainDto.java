package com.School.School_management.Dto;

import java.time.LocalDate;

public class ComplainDto {
    private Long id;
    private Long schoolId;
    private String academicYear;
    private String userType;
    private String complainBy;
    private Long studentId;
    private String studentName;
    private Long studentClassId;
    private String studentClassName;
    private Long teacherId;
    private String teacherName;
    private Long complainTypeId;
    private String complainTypeName;
    private LocalDate complainDate;
    private LocalDate actionDate;
    private String complain;

    public ComplainDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }

    public String getComplainBy() { return complainBy; }
    public void setComplainBy(String complainBy) { this.complainBy = complainBy; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public Long getStudentClassId() { return studentClassId; }
    public void setStudentClassId(Long studentClassId) { this.studentClassId = studentClassId; }

    public String getStudentClassName() { return studentClassName; }
    public void setStudentClassName(String studentClassName) { this.studentClassName = studentClassName; }

    public Long getTeacherId() { return teacherId; }
    public void setTeacherId(Long teacherId) { this.teacherId = teacherId; }

    public String getTeacherName() { return teacherName; }
    public void setTeacherName(String teacherName) { this.teacherName = teacherName; }

    public Long getComplainTypeId() { return complainTypeId; }
    public void setComplainTypeId(Long complainTypeId) { this.complainTypeId = complainTypeId; }

    public String getComplainTypeName() { return complainTypeName; }
    public void setComplainTypeName(String complainTypeName) { this.complainTypeName = complainTypeName; }

    public LocalDate getComplainDate() { return complainDate; }
    public void setComplainDate(LocalDate complainDate) { this.complainDate = complainDate; }

    public LocalDate getActionDate() { return actionDate; }
    public void setActionDate(LocalDate actionDate) { this.actionDate = actionDate; }

    public String getComplain() { return complain; }
    public void setComplain(String complain) { this.complain = complain; }
}
