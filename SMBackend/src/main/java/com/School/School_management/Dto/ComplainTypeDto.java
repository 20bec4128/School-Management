package com.School.School_management.Dto;

public class ComplainTypeDto {
    private Long id;
    private Long schoolId;
    private String complainType;

    public ComplainTypeDto() {}

    public ComplainTypeDto(Long id, Long schoolId, String complainType) {
        this.id = id;
        this.schoolId = schoolId;
        this.complainType = complainType;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public String getComplainType() { return complainType; }
    public void setComplainType(String complainType) { this.complainType = complainType; }
}
