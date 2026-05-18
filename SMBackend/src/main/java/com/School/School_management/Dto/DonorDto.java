package com.School.School_management.Dto;

import java.math.BigDecimal;

public class DonorDto {

    public static class Request {
        private Long schoolId;
        private String academicYear;
        private String donorType;
        private String donorName;
        private String contactName;
        private String email;
        private String phone;
        private BigDecimal amount;
        private String address;
        private String note;

        public Long getSchoolId() { return schoolId; }
        public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }
        public String getAcademicYear() { return academicYear; }
        public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }
        public String getDonorType() { return donorType; }
        public void setDonorType(String donorType) { this.donorType = donorType; }
        public String getDonorName() { return donorName; }
        public void setDonorName(String donorName) { this.donorName = donorName; }
        public String getContactName() { return contactName; }
        public void setContactName(String contactName) { this.contactName = contactName; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }

    public static class Response {
        private Long id;
        private Long schoolId;
        private String schoolName;
        private String academicYear;
        private String donorType;
        private String donorName;
        private String contactName;
        private String email;
        private String phone;
        private BigDecimal amount;
        private String address;
        private String note;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getSchoolId() { return schoolId; }
        public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }
        public String getSchoolName() { return schoolName; }
        public void setSchoolName(String schoolName) { this.schoolName = schoolName; }
        public String getAcademicYear() { return academicYear; }
        public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }
        public String getDonorType() { return donorType; }
        public void setDonorType(String donorType) { this.donorType = donorType; }
        public String getDonorName() { return donorName; }
        public void setDonorName(String donorName) { this.donorName = donorName; }
        public String getContactName() { return contactName; }
        public void setContactName(String contactName) { this.contactName = contactName; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }
}

