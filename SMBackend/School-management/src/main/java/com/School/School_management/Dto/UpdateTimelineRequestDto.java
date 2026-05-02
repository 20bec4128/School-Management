package com.School.School_management.Dto;

import java.time.LocalDate;

public class UpdateTimelineRequestDto {
    private LocalDate startDate;
    private LocalDate endDate;

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
}

