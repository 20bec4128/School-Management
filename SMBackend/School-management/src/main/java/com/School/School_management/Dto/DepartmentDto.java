package com.School.School_management.Dto;

public class DepartmentDto {
    private Long id;
    private Long schoolId;
    private String schoolName;
    private String title;
    private String note;
    private String isViewOnWeb;
    private String status;

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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getIsViewOnWeb() {
        return isViewOnWeb;
    }

    public void setIsViewOnWeb(String isViewOnWeb) {
        this.isViewOnWeb = isViewOnWeb;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
