package com.School.School_management.Dto;

public class GalleryDto {

    public static class Request {
        private Long schoolId;
        private String title;
        private String note;
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

        public String getNote() {
            return note;
        }

        public void setNote(String note) {
            this.note = note;
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
        private Long headOfficeId;
        private String title;
        private String note;
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

        public Long getHeadOfficeId() {
            return headOfficeId;
        }

        public void setHeadOfficeId(Long headOfficeId) {
            this.headOfficeId = headOfficeId;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getNote() {
            return note;
        }

        public void setNote(String note) {
            this.note = note;
        }

        public Boolean getIsViewOnWeb() {
            return isViewOnWeb;
        }

        public void setIsViewOnWeb(Boolean viewOnWeb) {
            isViewOnWeb = viewOnWeb;
        }
    }
}
