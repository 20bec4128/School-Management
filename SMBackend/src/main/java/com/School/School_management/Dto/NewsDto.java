package com.School.School_management.Dto;

import java.time.LocalDate;

public class NewsDto {

    public static class Request {
        private Long schoolId;
        private String title;
        private LocalDate date;
        private String image;
        private String news;
        private Boolean isViewOnWeb;

        public Long getSchoolId() { return schoolId; }
        public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
        public String getImage() { return image; }
        public void setImage(String image) { this.image = image; }
        public String getNews() { return news; }
        public void setNews(String news) { this.news = news; }
        public Boolean getIsViewOnWeb() { return isViewOnWeb; }
        public void setIsViewOnWeb(Boolean viewOnWeb) { isViewOnWeb = viewOnWeb; }
    }

    public static class Response {
        private Long id;
        private Long schoolId;
        private String schoolName;
        private String title;
        private LocalDate date;
        private String image;
        private String news;
        private Boolean isViewOnWeb;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getSchoolId() { return schoolId; }
        public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }
        public String getSchoolName() { return schoolName; }
        public void setSchoolName(String schoolName) { this.schoolName = schoolName; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
        public String getImage() { return image; }
        public void setImage(String image) { this.image = image; }
        public String getNews() { return news; }
        public void setNews(String news) { this.news = news; }
        public Boolean getIsViewOnWeb() { return isViewOnWeb; }
        public void setIsViewOnWeb(Boolean viewOnWeb) { isViewOnWeb = viewOnWeb; }
    }
}
