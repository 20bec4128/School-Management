package com.School.School_management.Dto;

import java.time.LocalDateTime;

public class LiveClassStartResponseDto {
    private Long id;
    private String roomName;
    private String status;
    private LocalDateTime startedAt;
    private Integer notificationsCreated;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public Integer getNotificationsCreated() { return notificationsCreated; }
    public void setNotificationsCreated(Integer notificationsCreated) { this.notificationsCreated = notificationsCreated; }
}

