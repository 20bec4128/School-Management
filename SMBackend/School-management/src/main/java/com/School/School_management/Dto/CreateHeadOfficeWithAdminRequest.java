package com.School.School_management.Dto;

public class CreateHeadOfficeWithAdminRequest {
    private HeadOfficeDto headOffice;
    private AdminCredentials admin;

    public HeadOfficeDto getHeadOffice() {
        return headOffice;
    }

    public void setHeadOffice(HeadOfficeDto headOffice) {
        this.headOffice = headOffice;
    }

    public AdminCredentials getAdmin() {
        return admin;
    }

    public void setAdmin(AdminCredentials admin) {
        this.admin = admin;
    }

    public static class AdminCredentials {
        private String username;
        private String password;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}

