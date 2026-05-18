package com.School.School_management.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "mark_send_sms")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarkSendSms {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "head_office_id")
    private Long headOfficeId;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "school_name")
    private String schoolName;

    @Column(name = "exam_term", nullable = false)
    private String examTerm;

    @Column(name = "receiver_type", nullable = false)
    private String receiverType;

    @Column(name = "receiver", nullable = false)
    private String receiver;

    @Column(name = "template")
    private String template;

    @Column(name = "sms", nullable = false, columnDefinition = "TEXT")
    private String sms;

    @Column(name = "gateway", nullable = false)
    private String gateway;

    @Column(name = "send_date", nullable = false)
    private LocalDate sendDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.sendDate == null) {
            this.sendDate = LocalDate.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}