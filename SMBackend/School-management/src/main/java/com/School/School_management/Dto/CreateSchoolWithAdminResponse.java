package com.School.School_management.Dto;

public class CreateSchoolWithAdminResponse {
    private ManageSchoolDto school;
    private Long adminUserId;
    private String adminUsername;

    public CreateSchoolWithAdminResponse(ManageSchoolDto school, Long adminUserId, String adminUsername) {
        this.school = school;
        this.adminUserId = adminUserId;
        this.adminUsername = adminUsername;
    }

    public ManageSchoolDto getSchool() {
        return school;
    }

    public Long getAdminUserId() {
        return adminUserId;
    }

    public String getAdminUsername() {
        return adminUsername;
    }
}
