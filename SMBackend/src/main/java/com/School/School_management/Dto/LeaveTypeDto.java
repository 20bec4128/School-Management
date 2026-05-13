package com.School.School_management.Dto;

public class LeaveTypeDto {

    public static class Request {
        private Long schoolId;
        private Long designationId;
        private String applicantType;
        private String leaveType;
        private Integer allowedLeavesPerYear;

        public Long getSchoolId() {
            return schoolId;
        }

        public void setSchoolId(Long schoolId) {
            this.schoolId = schoolId;
        }

        public Long getDesignationId() {
            return designationId;
        }

        public void setDesignationId(Long designationId) {
            this.designationId = designationId;
        }

        public String getApplicantType() {
            return applicantType;
        }

        public void setApplicantType(String applicantType) {
            this.applicantType = applicantType;
        }

        public String getLeaveType() {
            return leaveType;
        }

        public void setLeaveType(String leaveType) {
            this.leaveType = leaveType;
        }

        public Integer getAllowedLeavesPerYear() {
            return allowedLeavesPerYear;
        }

        public void setAllowedLeavesPerYear(Integer allowedLeavesPerYear) {
            this.allowedLeavesPerYear = allowedLeavesPerYear;
        }
    }

    public static class Response {
        private Long id;
        private Long schoolId;
        private String schoolName;
        private Long designationId;
        private String designationName;
        private String applicantType;
        private String leaveType;
        private Integer allowedLeavesPerYear;

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

        public String getApplicantType() {
            return applicantType;
        }

        public void setApplicantType(String applicantType) {
            this.applicantType = applicantType;
        }

        public String getLeaveType() {
            return leaveType;
        }

        public void setLeaveType(String leaveType) {
            this.leaveType = leaveType;
        }

        public Integer getAllowedLeavesPerYear() {
            return allowedLeavesPerYear;
        }

        public void setAllowedLeavesPerYear(Integer allowedLeavesPerYear) {
            this.allowedLeavesPerYear = allowedLeavesPerYear;
        }
    }
}
