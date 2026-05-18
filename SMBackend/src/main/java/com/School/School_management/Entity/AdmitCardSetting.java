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
@Table(name = "admit_card_settings")
public class AdmitCardSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "head_office_id", nullable = false)
    private Long headOfficeId;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "border_color", nullable = false)
    private String borderColor;

    @Column(name = "top_background", nullable = false)
    private String topBackground;

    @Column(name = "card_school_name", columnDefinition = "TEXT")
    private String cardSchoolName;

    @Column(name = "school_name_font_size")
    private String schoolNameFontSize;

    @Column(name = "school_name_color")
    private String schoolNameColor;

    @Column(name = "school_address", columnDefinition = "TEXT")
    private String schoolAddress;

    @Column(name = "school_address_color")
    private String schoolAddressColor;

    @Column(name = "admit_title_font_size")
    private String admitTitleFontSize;

    @Column(name = "admit_title_color")
    private String admitTitleColor;

    @Column(name = "admit_title_background")
    private String admitTitleBackground;

    @Column(name = "title_font_size")
    private String titleFontSize;

    @Column(name = "title_color")
    private String titleColor;

    @Column(name = "value_font_size")
    private String valueFontSize;

    @Column(name = "value_color")
    private String valueColor;

    @Column(name = "exam_title_font_size")
    private String examTitleFontSize;

    @Column(name = "exam_title_color")
    private String examTitleColor;

    @Column(name = "subject_font_size")
    private String subjectFontSize;

    @Column(name = "subject_color")
    private String subjectColor;

    @Column(name = "bottom_signature", nullable = false, columnDefinition = "TEXT")
    private String bottomSignature;

    @Column(name = "signature_background", nullable = false)
    private String signatureBackground;

    @Column(name = "signature_color")
    private String signatureColor;

    @Column(name = "signature_align")
    private String signatureAlign;

    @Column(name = "card_logo_url", columnDefinition = "TEXT")
    private String cardLogoUrl;

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

    public String getBorderColor() {
        return borderColor;
    }

    public void setBorderColor(String borderColor) {
        this.borderColor = borderColor;
    }

    public String getTopBackground() {
        return topBackground;
    }

    public void setTopBackground(String topBackground) {
        this.topBackground = topBackground;
    }

    public String getCardSchoolName() {
        return cardSchoolName;
    }

    public void setCardSchoolName(String cardSchoolName) {
        this.cardSchoolName = cardSchoolName;
    }

    public String getSchoolNameFontSize() {
        return schoolNameFontSize;
    }

    public void setSchoolNameFontSize(String schoolNameFontSize) {
        this.schoolNameFontSize = schoolNameFontSize;
    }

    public String getSchoolNameColor() {
        return schoolNameColor;
    }

    public void setSchoolNameColor(String schoolNameColor) {
        this.schoolNameColor = schoolNameColor;
    }

    public String getSchoolAddress() {
        return schoolAddress;
    }

    public void setSchoolAddress(String schoolAddress) {
        this.schoolAddress = schoolAddress;
    }

    public String getSchoolAddressColor() {
        return schoolAddressColor;
    }

    public void setSchoolAddressColor(String schoolAddressColor) {
        this.schoolAddressColor = schoolAddressColor;
    }

    public String getAdmitTitleFontSize() {
        return admitTitleFontSize;
    }

    public void setAdmitTitleFontSize(String admitTitleFontSize) {
        this.admitTitleFontSize = admitTitleFontSize;
    }

    public String getAdmitTitleColor() {
        return admitTitleColor;
    }

    public void setAdmitTitleColor(String admitTitleColor) {
        this.admitTitleColor = admitTitleColor;
    }

    public String getAdmitTitleBackground() {
        return admitTitleBackground;
    }

    public void setAdmitTitleBackground(String admitTitleBackground) {
        this.admitTitleBackground = admitTitleBackground;
    }

    public String getTitleFontSize() {
        return titleFontSize;
    }

    public void setTitleFontSize(String titleFontSize) {
        this.titleFontSize = titleFontSize;
    }

    public String getTitleColor() {
        return titleColor;
    }

    public void setTitleColor(String titleColor) {
        this.titleColor = titleColor;
    }

    public String getValueFontSize() {
        return valueFontSize;
    }

    public void setValueFontSize(String valueFontSize) {
        this.valueFontSize = valueFontSize;
    }

    public String getValueColor() {
        return valueColor;
    }

    public void setValueColor(String valueColor) {
        this.valueColor = valueColor;
    }

    public String getExamTitleFontSize() {
        return examTitleFontSize;
    }

    public void setExamTitleFontSize(String examTitleFontSize) {
        this.examTitleFontSize = examTitleFontSize;
    }

    public String getExamTitleColor() {
        return examTitleColor;
    }

    public void setExamTitleColor(String examTitleColor) {
        this.examTitleColor = examTitleColor;
    }

    public String getSubjectFontSize() {
        return subjectFontSize;
    }

    public void setSubjectFontSize(String subjectFontSize) {
        this.subjectFontSize = subjectFontSize;
    }

    public String getSubjectColor() {
        return subjectColor;
    }

    public void setSubjectColor(String subjectColor) {
        this.subjectColor = subjectColor;
    }

    public String getBottomSignature() {
        return bottomSignature;
    }

    public void setBottomSignature(String bottomSignature) {
        this.bottomSignature = bottomSignature;
    }

    public String getSignatureBackground() {
        return signatureBackground;
    }

    public void setSignatureBackground(String signatureBackground) {
        this.signatureBackground = signatureBackground;
    }

    public String getSignatureColor() {
        return signatureColor;
    }

    public void setSignatureColor(String signatureColor) {
        this.signatureColor = signatureColor;
    }

    public String getSignatureAlign() {
        return signatureAlign;
    }

    public void setSignatureAlign(String signatureAlign) {
        this.signatureAlign = signatureAlign;
    }

    public String getCardLogoUrl() {
        return cardLogoUrl;
    }

    public void setCardLogoUrl(String cardLogoUrl) {
        this.cardLogoUrl = cardLogoUrl;
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

