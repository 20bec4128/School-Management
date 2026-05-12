package com.School.School_management.Dto;

import java.time.LocalDateTime;

public class LiveClassEndResponseDto {
    private Long id;
    private String status;
    private LocalDateTime endedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }
}

