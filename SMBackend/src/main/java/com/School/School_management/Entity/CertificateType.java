package com.School.School_management.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "certificate_types")
public class CertificateType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "head_office_id", nullable = false)
    private Long headOfficeId;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "certificate_name", nullable = false)
    private String certificateName;

    @Column(name = "school_name_on_card")
    private String schoolNameOnCard;

    @Column(name = "certificate_text", columnDefinition = "TEXT")
    private String certificateText;

    @Column(name = "footer_left_text")
    private String footerLeftText;

    @Column(name = "footer_middle_text")
    private String footerMiddleText;

    @Column(name = "footer_right_text")
    private String footerRightText;

    @Column(name = "background_url", columnDefinition = "TEXT")
    private String backgroundUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

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

    public Long getSchoolId() {
        return schoolId;
    }

    public void setSchoolId(Long schoolId) {
        this.schoolId = schoolId;
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
