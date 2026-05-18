package com.School.School_management.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "general_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeneralSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "head_office_id")
    private Long headOfficeId;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "school_name")
    private String schoolName;

    @Column(name = "brand_name", nullable = false)
    private String brandName;

    @Column(name = "brand_title", nullable = false)
    private String brandTitle;

    @Column(name = "language", nullable = false)
    private String language;

    @Column(name = "currency")
    private String currency;

    @Column(name = "currency_symbol")
    private String currencySymbol;

    @Column(name = "enable_rtl", nullable = false)
    private String enableRtl;

    @Column(name = "enable_frontend", nullable = false)
    private String enableFrontend;

    @Column(name = "theme", nullable = false)
    private String theme;

    @Column(name = "time_zone", nullable = false)
    private String timeZone;

    @Column(name = "date_format", nullable = false)
    private String dateFormat;

    @Column(name = "brand_logo", length = 2000)
    private String brandLogo;

    @Column(name = "favicon_icon", length = 2000)
    private String faviconIcon;

    @Column(name = "brand_footer")
    private String brandFooter;

    @Column(name = "google_analytics")
    private String googleAnalytics;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.enableRtl == null) {
            this.enableRtl = "No";
        }
        if (this.enableFrontend == null) {
            this.enableFrontend = "Yes";
        }
        if (this.theme == null) {
            this.theme = "Navy Blue";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
