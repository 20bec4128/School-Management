package com.School.School_management.Dto;

public class CreateSchoolWithAdminRequest {
    private ManageSchoolDto school;
    private SchoolAdminRequest admin;

    public ManageSchoolDto getSchool() {
        return school;
    }

    public void setSchool(ManageSchoolDto school) {
        this.school = school;
    }

    public SchoolAdminRequest getAdmin() {
        return admin;
    }

    public void setAdmin(SchoolAdminRequest admin) {
        this.admin = admin;
    }

    public static class SchoolAdminRequest {
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
