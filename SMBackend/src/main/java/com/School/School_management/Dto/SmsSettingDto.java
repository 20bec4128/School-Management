package com.School.School_management.Dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
}
