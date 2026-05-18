package com.School.School_management.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "head_office_id")
    private Long headOfficeId;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "school_name")
    private String schoolName;

    @Column(name = "gateway", nullable = false)
    private String gateway;

    @Column(name = "paypal_email")
    private String paypalEmail;

    @Column(name = "secret_key")
    private String secretKey;

    @Column(name = "publishable_key")
    private String publishableKey;

    @Column(name = "payumoney_key")
    private String payumoneyKey;

    @Column(name = "key_salt")
    private String keySalt;

    @Column(name = "merchant_id")
    private String merchantId;

    @Column(name = "working_key")
    private String workingKey;

    @Column(name = "access_code")
    private String accessCode;

    @Column(name = "merchant_key")
    private String merchantKey;

    @Column(name = "merchant_mid")
    private String merchantMid;

    @Column(name = "website")
    private String website;

    @Column(name = "industry_type")
    private String industryType;

    @Column(name = "public_key")
    private String publicKey;

    @Column(name = "password")
    private String password;

    @Column(name = "store_id")
    private String storeId;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "submer_name")
    private String submerName;

    @Column(name = "submer_id")
    private String submerId;

    @Column(name = "terminal_id")
    private String terminalId;

    @Column(name = "client_key")
    private String clientKey;

    @Column(name = "server_key")
    private String serverKey;

    @Column(name = "api_key")
    private String apiKey;

    @Column(name = "auth_token")
    private String authToken;

    @Column(name = "vendor_id")
    private String vendorId;

    @Column(name = "hash_key")
    private String hashKey;

    @Column(name = "is_demo", nullable = false)
    private String isDemo;

    @Column(name = "extra_charge")
    private String extraCharge;

    @Column(name = "is_active", nullable = false)
    private String isActive;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.isDemo == null) {
            this.isDemo = "Yes";
        }
        if (this.isActive == null) {
            this.isActive = "No";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
