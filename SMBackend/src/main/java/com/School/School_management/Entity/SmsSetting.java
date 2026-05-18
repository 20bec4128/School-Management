package com.School.School_management.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sms_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SmsSetting {

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

    @Column(name = "account_sid")
    private String accountSid;

    @Column(name = "auth_token")
    private String authToken;

    @Column(name = "from_number")
    private String fromNumber;

    @Column(name = "username")
    private String username;

    @Column(name = "password")
    private String password;

    @Column(name = "api_key")
    private String apiKey;

    @Column(name = "mo_number")
    private String moNumber;

    @Column(name = "auth_id")
    private String authId;

    @Column(name = "hash_key")
    private String hashKey;

    @Column(name = "sender_id")
    private String senderId;

    @Column(name = "auth_key")
    private String authKey;

    @Column(name = "router")
    private String router;

    @Column(name = "sms_type")
    private String smsType;

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
        if (this.isActive == null) {
            this.isActive = "No";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
