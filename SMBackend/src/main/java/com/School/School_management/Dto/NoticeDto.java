package com.School.School_management.Dto;

import java.time.LocalDate;

public class NoticeDto {

    public static class Request {
        private Long schoolId;
        private String title;
        private LocalDate date;
        private String noticeFor;
        private String notice;
        private Boolean isViewOnWeb;

        public Long getSchoolId() {
            return schoolId;
        }

        public void setSchoolId(Long schoolId) {
            this.schoolId = schoolId;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public LocalDate getDate() {
            return date;
        }

        public void setDate(LocalDate date) {
            this.date = date;
        }

        public String getNoticeFor() {
            return noticeFor;
        }

        public void setNoticeFor(String noticeFor) {
            this.noticeFor = noticeFor;
        }

        public String getNotice() {
            return notice;
        }

        public void setNotice(String notice) {
            this.notice = notice;
        }

        public Boolean getIsViewOnWeb() {
            return isViewOnWeb;
        }

        public void setIsViewOnWeb(Boolean viewOnWeb) {
            isViewOnWeb = viewOnWeb;
        }
    }

    public static class Response {
        private Long id;
        private Long schoolId;
        private String schoolName;
        private String title;
        private LocalDate date;
        private String noticeFor;
        private String notice;
        private Boolean isViewOnWeb;

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

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public LocalDate getDate() {
            return date;
        }

        public void setDate(LocalDate date) {
            this.date = date;
        }

        public String getNoticeFor() {
            return noticeFor;
        }

        public void setNoticeFor(String noticeFor) {
            this.noticeFor = noticeFor;
        }

        public String getNotice() {
            return notice;
        }

        public void setNotice(String notice) {
            this.notice = notice;
        }

        public Boolean getIsViewOnWeb() {
            return isViewOnWeb;
        }

        public void setIsViewOnWeb(Boolean viewOnWeb) {
            isViewOnWeb = viewOnWeb;
        }
    }
}
