package com.School.School_management.Dto;

import java.time.LocalDateTime;

public class SmsSettingDto {
    private Long id;
    private Long headOfficeId;
    private Long schoolId;
    private String schoolName;
    private String school; // Mapping helper for frontend compatibility
    private String gateway;
    private String accountSid;
    private String twilio; // Mapping helper for frontend compatibility: twilio maps to accountSid
    private String authToken;
    private String fromNumber;
    private String username;
    private String bulk; // Mapping helper for frontend compatibility: bulk maps to username
    private String msg91; // Mapping helper for frontend compatibility: msg91 maps to username
    private String textLocal; // Mapping helper for frontend compatibility: textLocal maps to username
    private String smsCountry; // Mapping helper for frontend compatibility: smsCountry maps to username
    private String betaSms; // Mapping helper for frontend compatibility: betaSms maps to username
    private String bulkPk; // Mapping helper for frontend compatibility: bulkPk maps to username
    private String alphaNet; // Mapping helper for frontend compatibility: alphaNet maps to username
    private String bdBulk; // Mapping helper for frontend compatibility: bdBulk maps to hashKey
    private String mimSms; // Mapping helper for frontend compatibility: mimSms maps to apiKey
    private String password;
    private String apiKey;
    private String moNumber;
    private String authId;
    private String hashKey;
    private String senderId;
    private String authKey;
    private String router;
    private String smsType;
    private String isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SmsSettingDto() {
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

    public String getSchoolName() {
        return schoolName;
    }

    public void setSchoolName(String schoolName) {
        this.schoolName = schoolName;
    }

    public String getSchool() {
        return school;
    }

    public void setSchool(String school) {
        this.school = school;
    }

    public String getGateway() {
        return gateway;
    }

    public void setGateway(String gateway) {
        this.gateway = gateway;
    }

    public String getAccountSid() {
        return accountSid;
    }

    public void setAccountSid(String accountSid) {
        this.accountSid = accountSid;
    }

    public String getTwilio() {
        return twilio;
    }

    public void setTwilio(String twilio) {
        this.twilio = twilio;
    }

    public String getAuthToken() {
        return authToken;
    }

    public void setAuthToken(String authToken) {
        this.authToken = authToken;
    }

    public String getFromNumber() {
        return fromNumber;
    }

    public void setFromNumber(String fromNumber) {
        this.fromNumber = fromNumber;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getBulk() {
        return bulk;
    }

    public void setBulk(String bulk) {
        this.bulk = bulk;
    }

    public String getMsg91() {
        return msg91;
    }

    public void setMsg91(String msg91) {
        this.msg91 = msg91;
    }

    public String getTextLocal() {
        return textLocal;
    }

    public void setTextLocal(String textLocal) {
        this.textLocal = textLocal;
    }

    public String getSmsCountry() {
        return smsCountry;
    }

    public void setSmsCountry(String smsCountry) {
        this.smsCountry = smsCountry;
    }

    public String getBetaSms() {
        return betaSms;
    }

    public void setBetaSms(String betaSms) {
        this.betaSms = betaSms;
    }

    public String getBulkPk() {
        return bulkPk;
    }

    public void setBulkPk(String bulkPk) {
        this.bulkPk = bulkPk;
    }

    public String getAlphaNet() {
        return alphaNet;
    }

    public void setAlphaNet(String alphaNet) {
        this.alphaNet = alphaNet;
    }

    public String getBdBulk() {
        return bdBulk;
    }

    public void setBdBulk(String bdBulk) {
        this.bdBulk = bdBulk;
    }

    public String getMimSms() {
        return mimSms;
    }

    public void setMimSms(String mimSms) {
        this.mimSms = mimSms;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getMoNumber() {
        return moNumber;
    }

    public void setMoNumber(String moNumber) {
        this.moNumber = moNumber;
    }

    public String getAuthId() {
        return authId;
    }

    public void setAuthId(String authId) {
        this.authId = authId;
    }

    public String getHashKey() {
        return hashKey;
    }

    public void setHashKey(String hashKey) {
        this.hashKey = hashKey;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getAuthKey() {
        return authKey;
    }

    public void setAuthKey(String authKey) {
        this.authKey = authKey;
    }

    public String getRouter() {
        return router;
    }

    public void setRouter(String router) {
        this.router = router;
    }

    public String getSmsType() {
        return smsType;
    }

    public void setSmsType(String smsType) {
        this.smsType = smsType;
    }

    public String getIsActive() {
        return isActive;
    }

    public void setIsActive(String isActive) {
        this.isActive = isActive;
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
