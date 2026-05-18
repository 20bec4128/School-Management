package com.School.School_management.Dto;

public class ExamTermDto {
    private Long id;
    private Long schoolId;
    private String schoolName;
    private String gradeName;
    private Double gradePoint;
    private Integer markFrom;
    private Integer markTo;
    private String note;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSchoolId() {
        return schoolId;
    }

    public void setSchoolId(Long schoolId) {
        this.schoolId = schoolId;
    }

    public String getSchoolName() {
        return schoolName;
    }

    public void setSchoolName(String schoolName) {
        this.schoolName = schoolName;
    }

    public String getGradeName() {
        return gradeName;
    }

    public void setGradeName(String gradeName) {
        this.gradeName = gradeName;
    }

    public Double getGradePoint() {
        return gradePoint;
    }

    public void setGradePoint(Double gradePoint) {
        this.gradePoint = gradePoint;
    }

    public Integer getMarkFrom() {
        return markFrom;
    }

    public void setMarkFrom(Integer markFrom) {
        this.markFrom = markFrom;
    }

    public Integer getMarkTo() {
        return markTo;
    }

    public void setMarkTo(Integer markTo) {
        this.markTo = markTo;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
