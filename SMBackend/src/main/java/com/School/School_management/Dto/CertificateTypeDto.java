package com.School.School_management.Dto;

import java.time.LocalDateTime;

public class CertificateTypeDto {
    private Long id;
    private Long headOfficeId;
    private String headOfficeName;
    private Long schoolId;
    private String schoolName;
    private String certificateName;
    private String schoolNameOnCard;
    private String certificateText;
    private String footerLeftText;
    private String footerMiddleText;
    private String footerRightText;
    private String backgroundUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getCertificateName() {
        return certificateName;
    }

    public void setCertificateName(String certificateName) {
        this.certificateName = certificateName;
    }

    public String getSchoolNameOnCard() {
        return schoolNameOnCard;
    }

    public void setSchoolNameOnCard(String schoolNameOnCard) {
        this.schoolNameOnCard = schoolNameOnCard;
    }

    public String getCertificateText() {
        return certificateText;
    }

    public void setCertificateText(String certificateText) {
        this.certificateText = certificateText;
    }

    public String getFooterLeftText() {
        return footerLeftText;
    }

    public void setFooterLeftText(String footerLeftText) {
        this.footerLeftText = footerLeftText;
    }

    public String getFooterMiddleText() {
        return footerMiddleText;
    }

    public void setFooterMiddleText(String footerMiddleText) {
        this.footerMiddleText = footerMiddleText;
    }

    public String getFooterRightText() {
        return footerRightText;
    }

    public void setFooterRightText(String footerRightText) {
        this.footerRightText = footerRightText;
    }

    public String getBackgroundUrl() {
        return backgroundUrl;
    }

    public void setBackgroundUrl(String backgroundUrl) {
        this.backgroundUrl = backgroundUrl;
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
