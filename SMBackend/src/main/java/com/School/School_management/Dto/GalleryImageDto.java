package com.School.School_management.Dto;

public class GalleryImageDto {

    public static class Request {
        private Long schoolId;
        private Long galleryId;
        private String title;
        private String caption;

        public Long getSchoolId() {
            return schoolId;
        }

        public void setSchoolId(Long schoolId) {
            this.schoolId = schoolId;
        }

        public Long getGalleryId() {
            return galleryId;
        }

        public void setGalleryId(Long galleryId) {
            this.galleryId = galleryId;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getCaption() {
            return caption;
        }

        public void setCaption(String caption) {
            this.caption = caption;
        }
    }

    public static class Response {
        private Long id;
        private Long schoolId;
        private String schoolName;
        private Long headOfficeId;
        private Long galleryId;
        private String galleryTitle;
        private String title;
        private String imagePath;
        private String caption;

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

        public Long getGalleryId() {
            return galleryId;
        }

        public void setGalleryId(Long galleryId) {
            this.galleryId = galleryId;
        }

        public String getGalleryTitle() {
            return galleryTitle;
        }

        public void setGalleryTitle(String galleryTitle) {
            this.galleryTitle = galleryTitle;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getImagePath() {
            return imagePath;
        }

        public void setImagePath(String imagePath) {
            this.imagePath = imagePath;
        }

        public String getCaption() {
            return caption;
        }

        public void setCaption(String caption) {
            this.caption = caption;
        }
    }
}
