package com.School.School_management.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "absent_email_setting")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AbsentEmailSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "head_office_id")
    private Long headOfficeId;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled;

    @Column(name = "receiver_type", nullable = false)
    private String receiverType;

    @Column(name = "subject_template", nullable = false)
    private String subjectTemplate;

    @Column(name = "email_body_template", nullable = false, columnDefinition = "TEXT")
    private String emailBodyTemplate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.enabled == null) this.enabled = Boolean.TRUE;
        if (this.receiverType == null || this.receiverType.trim().isEmpty()) this.receiverType = "Student";
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (this.enabled == null) this.enabled = Boolean.TRUE;
        if (this.receiverType == null || this.receiverType.trim().isEmpty()) this.receiverType = "Student";
    }
}

