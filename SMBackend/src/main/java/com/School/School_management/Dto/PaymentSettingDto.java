package com.School.School_management.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentSettingDto {
    private Long id;
    private Long headOfficeId;
    private Long schoolId;
    private String schoolName;
    private String school; // Mapping helper for frontend compatibility
    private String gateway;
    private String paypalEmail;
    private String paypal; // Mapping helper for frontend compatibility
    private String secretKey;
    private String publishableKey;
    private String payumoneyKey;
    private String payUMoney; // Mapping helper for frontend compatibility
    private String keySalt;
    private String merchantId;
    private String ccaVenue; // Mapping helper for frontend compatibility
    private String workingKey;
    private String accessCode;
    private String merchantKey;
    private String merchantMid;
    private String payTM; // Mapping helper for frontend compatibility
    private String website;
    private String industryType;
    private String publicKey;
    private String payStack; // Mapping helper for frontend compatibility
    private String password;
    private String storeId;
    private String userId;
    private String submerName;
    private String submerId;
    private String terminalId;
    private String clientKey;
    private String serverKey;
    private String apiKey;
    private String authToken;
    private String vendorId;
    private String hashKey;
    private String isDemo;
    private String extraCharge;
    private String isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
