package com.School.School_management.Dto;

import java.time.LocalDate;

public class HolidayDto {

    public static class Request {
        private Long schoolId;
        private String title;
        private LocalDate fromDate;
        private LocalDate toDate;
        private String note;
        private Boolean isViewOnWeb;

        public Long getSchoolId() { return schoolId; }
        public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public LocalDate getFromDate() { return fromDate; }
        public void setFromDate(LocalDate fromDate) { this.fromDate = fromDate; }
        public LocalDate getToDate() { return toDate; }
        public void setToDate(LocalDate toDate) { this.toDate = toDate; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
        public Boolean getIsViewOnWeb() { return isViewOnWeb; }
        public void setIsViewOnWeb(Boolean viewOnWeb) { isViewOnWeb = viewOnWeb; }
    }

    public static class Response {
        private Long id;
        private Long schoolId;
        private String schoolName;
        private String title;
        private LocalDate fromDate;
        private LocalDate toDate;
        private String note;
        private Boolean isViewOnWeb;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getSchoolId() { return schoolId; }
        public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }
        public String getSchoolName() { return schoolName; }
        public void setSchoolName(String schoolName) { this.schoolName = schoolName; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public LocalDate getFromDate() { return fromDate; }
        public void setFromDate(LocalDate fromDate) { this.fromDate = fromDate; }
        public LocalDate getToDate() { return toDate; }
        public void setToDate(LocalDate toDate) { this.toDate = toDate; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
        public Boolean getIsViewOnWeb() { return isViewOnWeb; }
        public void setIsViewOnWeb(Boolean viewOnWeb) { isViewOnWeb = viewOnWeb; }
    }
}
