package com.School.School_management.Dto;

public class VisitorPurposeDto {
    private Long id;
    private Long schoolId;
    private String purpose;

    public VisitorPurposeDto() {}

    public VisitorPurposeDto(Long id, Long schoolId, String purpose) {
        this.id = id;
        this.schoolId = schoolId;
        this.purpose = purpose;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
}
