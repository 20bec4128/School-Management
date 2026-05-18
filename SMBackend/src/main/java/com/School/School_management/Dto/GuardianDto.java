package com.School.School_management.Dto;

public class GuardianDto {

    public static class Request {
        private Long schoolId;
        private String name;
        private String phone;
        private String profession;
        private String religion;
        private String presentAddress;
        private String permanentAddress;
        private String nationalId;
        private String email;
        private String username;
        private String password;
        private String otherInfo;
        private String photoUrl;

        public Long getSchoolId() { return schoolId; }
        public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getProfession() { return profession; }
        public void setProfession(String profession) { this.profession = profession; }
        public String getReligion() { return religion; }
        public void setReligion(String religion) { this.religion = religion; }
        public String getPresentAddress() { return presentAddress; }
        public void setPresentAddress(String presentAddress) { this.presentAddress = presentAddress; }
        public String getPermanentAddress() { return permanentAddress; }
        public void setPermanentAddress(String permanentAddress) { this.permanentAddress = permanentAddress; }
        public String getNationalId() { return nationalId; }
        public void setNationalId(String nationalId) { this.nationalId = nationalId; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getOtherInfo() { return otherInfo; }
        public void setOtherInfo(String otherInfo) { this.otherInfo = otherInfo; }
        public String getPhotoUrl() { return photoUrl; }
        public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    }

    public static class Response {
        private Long id;
        private Long schoolId;
        private String schoolName;
        private String name;
        private String phone;
        private String profession;
        private String religion;
        private String presentAddress;
        private String permanentAddress;
        private String nationalId;
        private String email;
        private String username;
        private String otherInfo;
        private String photoUrl;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getSchoolId() { return schoolId; }
        public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }
        public String getSchoolName() { return schoolName; }
        public void setSchoolName(String schoolName) { this.schoolName = schoolName; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getProfession() { return profession; }
        public void setProfession(String profession) { this.profession = profession; }
        public String getReligion() { return religion; }
        public void setReligion(String religion) { this.religion = religion; }
        public String getPresentAddress() { return presentAddress; }
        public void setPresentAddress(String presentAddress) { this.presentAddress = presentAddress; }
        public String getPermanentAddress() { return permanentAddress; }
        public void setPermanentAddress(String permanentAddress) { this.permanentAddress = permanentAddress; }
        public String getNationalId() { return nationalId; }
        public void setNationalId(String nationalId) { this.nationalId = nationalId; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getOtherInfo() { return otherInfo; }
        public void setOtherInfo(String otherInfo) { this.otherInfo = otherInfo; }
        public String getPhotoUrl() { return photoUrl; }
        public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    }
}

