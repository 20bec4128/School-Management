package com.School.School_management.Dto;

public class HeadOfficeAdminInfoResponse {
    private Long adminUserId;
    private String username;

    public HeadOfficeAdminInfoResponse() {}

    public HeadOfficeAdminInfoResponse(Long adminUserId, String username) {
        this.adminUserId = adminUserId;
        this.username = username;
    }

    public Long getAdminUserId() {
        return adminUserId;
    }

    public void setAdminUserId(Long adminUserId) {
        this.adminUserId = adminUserId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}

