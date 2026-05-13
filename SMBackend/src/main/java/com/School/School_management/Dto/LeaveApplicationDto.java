package com.School.School_management.Dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class LeaveApplicationDto {

    public static class Request {
        private Long schoolId;
        private Long headOfficeId;
        private String applicantType;
        private Long designationId;
        private Long applicantId;
        private Long leaveTypeId;
        private LocalDate applicationDate;
        private LocalDate leaveFrom;
        private LocalDate leaveTo;
        private String leaveReason;
        private String status;

        public Long getSchoolId() {
            return schoolId;
        }

        public void setSchoolId(Long schoolId) {
            this.schoolId = schoolId;
        }

        public Long getHeadOfficeId() {
            return headOfficeId;
        }

        public void setHeadOfficeId(Long headOfficeId) {
            this.headOfficeId = headOfficeId;
        }

        public String getApplicantType() {
            return applicantType;
        }

        public void setApplicantType(String applicantType) {
            this.applicantType = applicantType;
        }

        public Long getDesignationId() {
            return designationId;
        }

        public void setDesignationId(Long designationId) {
            this.designationId = designationId;
        }

        public Long getApplicantId() {
            return applicantId;
        }

        public void setApplicantId(Long applicantId) {
            this.applicantId = applicantId;
        }

        public Long getLeaveTypeId() {
            return leaveTypeId;
        }

        public void setLeaveTypeId(Long leaveTypeId) {
            this.leaveTypeId = leaveTypeId;
        }

        public LocalDate getApplicationDate() {
            return applicationDate;
        }

        public void setApplicationDate(LocalDate applicationDate) {
            this.applicationDate = applicationDate;
        }

        public LocalDate getLeaveFrom() {
            return leaveFrom;
        }

        public void setLeaveFrom(LocalDate leaveFrom) {
            this.leaveFrom = leaveFrom;
        }

        public LocalDate getLeaveTo() {
            return leaveTo;
        }

        public void setLeaveTo(LocalDate leaveTo) {
            this.leaveTo = leaveTo;
        }

        public String getLeaveReason() {
            return leaveReason;
        }

        public void setLeaveReason(String leaveReason) {
            this.leaveReason = leaveReason;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }

    public static class Response {
        private Long id;
        private Long schoolId;
        private String schoolName;
        private Long headOfficeId;
        private String headOfficeName;
        private String academicYear;
        private String applicantType;
        private Long designationId;
        private String designationName;
        private Long applicantId;
        private String applicantName;
        private Long leaveTypeId;
        private String leaveTypeName;
        private LocalDate applicationDate;
        private LocalDate leaveFrom;
        private LocalDate leaveTo;
        private String leaveReason;
        private String status;
        private String attachmentName;
        private String attachmentUrl;
        private String attachmentType;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

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

        public Long getHeadOfficeId() {
            return headOfficeId;
        }

        public void setHeadOfficeId(Long headOfficeId) {
            this.headOfficeId = headOfficeId;
        }

        public String getHeadOfficeName() {
            return headOfficeName;
        }

        public void setHeadOfficeName(String headOfficeName) {
            this.headOfficeName = headOfficeName;
        }

        public String getAcademicYear() {
            return academicYear;
        }

        public void setAcademicYear(String academicYear) {
            this.academicYear = academicYear;
        }

        public String getApplicantType() {
            return applicantType;
        }

        public void setApplicantType(String applicantType) {
            this.applicantType = applicantType;
        }

        public Long getDesignationId() {
            return designationId;
        }

        public void setDesignationId(Long designationId) {
            this.designationId = designationId;
        }

        public String getDesignationName() {
            return designationName;
        }

        public void setDesignationName(String designationName) {
            this.designationName = designationName;
        }

        public Long getApplicantId() {
            return applicantId;
        }

        public void setApplicantId(Long applicantId) {
            this.applicantId = applicantId;
        }

        public String getApplicantName() {
            return applicantName;
        }

        public void setApplicantName(String applicantName) {
            this.applicantName = applicantName;
        }

        public Long getLeaveTypeId() {
            return leaveTypeId;
        }

        public void setLeaveTypeId(Long leaveTypeId) {
            this.leaveTypeId = leaveTypeId;
        }

        public String getLeaveTypeName() {
            return leaveTypeName;
        }

        public void setLeaveTypeName(String leaveTypeName) {
            this.leaveTypeName = leaveTypeName;
        }

        public LocalDate getApplicationDate() {
            return applicationDate;
        }

        public void setApplicationDate(LocalDate applicationDate) {
            this.applicationDate = applicationDate;
        }

        public LocalDate getLeaveFrom() {
            return leaveFrom;
        }

        public void setLeaveFrom(LocalDate leaveFrom) {
            this.leaveFrom = leaveFrom;
        }

        public LocalDate getLeaveTo() {
            return leaveTo;
        }

        public void setLeaveTo(LocalDate leaveTo) {
            this.leaveTo = leaveTo;
        }

        public String getLeaveReason() {
            return leaveReason;
        }

        public void setLeaveReason(String leaveReason) {
            this.leaveReason = leaveReason;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getAttachmentName() {
            return attachmentName;
        }

        public void setAttachmentName(String attachmentName) {
            this.attachmentName = attachmentName;
        }

        public String getAttachmentUrl() {
            return attachmentUrl;
        }

        public void setAttachmentUrl(String attachmentUrl) {
            this.attachmentUrl = attachmentUrl;
        }

        public String getAttachmentType() {
            return attachmentType;
        }

        public void setAttachmentType(String attachmentType) {
            this.attachmentType = attachmentType;
        }

        public LocalDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }

        public LocalDateTime getUpdatedAt() {
            return updatedAt;
        }

        public void setUpdatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
        }
    }
}
