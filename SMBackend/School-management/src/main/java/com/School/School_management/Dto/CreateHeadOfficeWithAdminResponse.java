package com.School.School_management.Dto;

public class CreateHeadOfficeWithAdminResponse {
    private HeadOfficeDto headOffice;
    private Long adminUserId;
    private String adminUsername;

    public CreateHeadOfficeWithAdminResponse() {}

    public CreateHeadOfficeWithAdminResponse(HeadOfficeDto headOffice, Long adminUserId, String adminUsername) {
        this.headOffice = headOffice;
        this.adminUserId = adminUserId;
        this.adminUsername = adminUsername;
    }

    public HeadOfficeDto getHeadOffice() {
        return headOffice;
    }

    public void setHeadOffice(HeadOfficeDto headOffice) {
        this.headOffice = headOffice;
    }

    public Long getAdminUserId() {
        return adminUserId;
    }

    public void setAdminUserId(Long adminUserId) {
        this.adminUserId = adminUserId;
    }

    public String getAdminUsername() {
        return adminUsername;
    }

    public void setAdminUsername(String adminUsername) {
        this.adminUsername = adminUsername;
    }
}

