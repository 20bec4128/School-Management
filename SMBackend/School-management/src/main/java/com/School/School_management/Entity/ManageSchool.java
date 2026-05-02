package com.School.School_management.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "schools")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManageSchool {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Basic Information
    @Column(nullable = false, unique = true)
    private String schoolUrl;

    private String schoolCode;

    @Column(nullable = false)
    private String schoolName;

    private String subscription;
    private String isDemo;
    private String status;

    @Column(columnDefinition = "TEXT")
    private String address;

    private String phone;

    private LocalDate registrationDate;

    @Column(nullable = false)
    private String email;

    private String fax;

    @Column(columnDefinition = "TEXT")
    private String footer;

    // Setting Information
    private String currency;
    private String currencySymbol;
    private String enableFrontend;
    private String examFinalResult;
    private String language;
    private String theme;
    private String onlineAdmission;
    private String enableRTL;
    private String zoomApiKey;
    private String zoomSecret;

    @Column(columnDefinition = "TEXT")
    private String googleMapUrl;

    // Social Information
    private String facebookUrl;
    private String twitterUrl;
    private String linkedinUrl;
    private String youtubeUrl;
    private String instagramUrl;
    private String pinterestUrl;

    // File Paths (important for your UI images)
    private String frontendLogoUrl;
    private String adminLogoUrl;

    @Column(name = "head_office_id")
    private Long headOfficeId;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	public String getSchoolUrl() {
		return schoolUrl;
	}
	public void setSchoolUrl(String schoolUrl) {
		this.schoolUrl = schoolUrl;
	}
	public String getSchoolCode() {
		return schoolCode;
	}
	public void setSchoolCode(String schoolCode) {
		this.schoolCode = schoolCode;
	}
	public String getSchoolName() {
		return schoolName;
	}
	public void setSchoolName(String schoolName) {
		this.schoolName = schoolName;
	}
	public String getSubscription() {
		return subscription;
	}
	public void setSubscription(String subscription) {
		this.subscription = subscription;
	}
	public String getIsDemo() {
		return isDemo;
	}
	public void setIsDemo(String isDemo) {
		this.isDemo = isDemo;
	}
	public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
	}
	public String getAddress() {
		return address;
	}
	public void setAddress(String address) {
		this.address = address;
	}
	public String getPhone() {
		return phone;
	}
	public void setPhone(String phone) {
		this.phone = phone;
	}
	public LocalDate getRegistrationDate() {
		return registrationDate;
	}
	public void setRegistrationDate(LocalDate registrationDate) {
		this.registrationDate = registrationDate;
	}
	public String getEmail() {
		return email;
	}
	public void setEmail(String email) {
		this.email = email;
	}

    public Long getHeadOfficeId() { return headOfficeId; }

    public void setHeadOfficeId(Long headOfficeId) { this.headOfficeId = headOfficeId; }

    public Boolean getIsDeleted() { return isDeleted; }

    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }
	public String getFax() {
		return fax;
	}
	public void setFax(String fax) {
		this.fax = fax;
	}
	public String getFooter() {
		return footer;
	}
	public void setFooter(String footer) {
		this.footer = footer;
	}
	public String getCurrency() {
		return currency;
	}
	public void setCurrency(String currency) {
		this.currency = currency;
	}
	public String getCurrencySymbol() {
		return currencySymbol;
	}
	public void setCurrencySymbol(String currencySymbol) {
		this.currencySymbol = currencySymbol;
	}
	public String getEnableFrontend() {
		return enableFrontend;
	}
	public void setEnableFrontend(String enableFrontend) {
		this.enableFrontend = enableFrontend;
	}
	public String getExamFinalResult() {
		return examFinalResult;
	}
	public void setExamFinalResult(String examFinalResult) {
		this.examFinalResult = examFinalResult;
	}
	public String getLanguage() {
		return language;
	}
	public void setLanguage(String language) {
		this.language = language;
	}
	public String getTheme() {
		return theme;
	}
	public void setTheme(String theme) {
		this.theme = theme;
	}
	public String getOnlineAdmission() {
		return onlineAdmission;
	}
	public void setOnlineAdmission(String onlineAdmission) {
		this.onlineAdmission = onlineAdmission;
	}
	public String getEnableRTL() {
		return enableRTL;
	}
	public void setEnableRTL(String enableRTL) {
		this.enableRTL = enableRTL;
	}
	public String getZoomApiKey() {
		return zoomApiKey;
	}
	public void setZoomApiKey(String zoomApiKey) {
		this.zoomApiKey = zoomApiKey;
	}
	public String getZoomSecret() {
		return zoomSecret;
	}
	public void setZoomSecret(String zoomSecret) {
		this.zoomSecret = zoomSecret;
	}
	public String getGoogleMapUrl() {
		return googleMapUrl;
	}
	public void setGoogleMapUrl(String googleMapUrl) {
		this.googleMapUrl = googleMapUrl;
	}
	public String getFacebookUrl() {
		return facebookUrl;
	}
	public void setFacebookUrl(String facebookUrl) {
		this.facebookUrl = facebookUrl;
	}
	public String getTwitterUrl() {
		return twitterUrl;
	}
	public void setTwitterUrl(String twitterUrl) {
		this.twitterUrl = twitterUrl;
	}
	public String getLinkedinUrl() {
		return linkedinUrl;
	}
	public void setLinkedinUrl(String linkedinUrl) {
		this.linkedinUrl = linkedinUrl;
	}
	public String getYoutubeUrl() {
		return youtubeUrl;
	}
	public void setYoutubeUrl(String youtubeUrl) {
		this.youtubeUrl = youtubeUrl;
	}
	public String getInstagramUrl() {
		return instagramUrl;
	}
	public void setInstagramUrl(String instagramUrl) {
		this.instagramUrl = instagramUrl;
	}
	public String getPinterestUrl() {
		return pinterestUrl;
	}
	public void setPinterestUrl(String pinterestUrl) {
		this.pinterestUrl = pinterestUrl;
	}
	public String getFrontendLogoUrl() {
		return frontendLogoUrl;
	}
	public void setFrontendLogoUrl(String frontendLogoUrl) {
		this.frontendLogoUrl = frontendLogoUrl;
	}
	public String getAdminLogoUrl() {
		return adminLogoUrl;
	}
	public void setAdminLogoUrl(String adminLogoUrl) {
		this.adminLogoUrl = adminLogoUrl;
	}
}
