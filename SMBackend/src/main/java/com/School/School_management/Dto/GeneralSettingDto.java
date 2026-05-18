package com.School.School_management.Dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeneralSettingDto {

    private Long id;
    private Long headOfficeId;
    private Long schoolId;
    private String schoolName;

    // Standard school setting compatibility helper
    private String school;

    private String brandName;
    private String brandTitle;
    private String language;
    private String currency;
    private String currencySymbol;
    private String enableRtl;
    private String enableFrontend;
    private String theme;
    private String timeZone;
    private String dateFormat;
    private String brandLogo;
    private String faviconIcon;
    private String brandFooter;
    private String googleAnalytics;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
