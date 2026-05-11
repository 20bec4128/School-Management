package com.School.School_management.Dto;

public class LiveClassJoinResponseDto {
    private Long liveClassId;
    private String roomName;
    private String wsUrl;
    private String token;
    private String identity;
    private String participantName;
    private String role;

    public Long getLiveClassId() { return liveClassId; }
    public void setLiveClassId(Long liveClassId) { this.liveClassId = liveClassId; }
    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }
    public String getWsUrl() { return wsUrl; }
    public void setWsUrl(String wsUrl) { this.wsUrl = wsUrl; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getIdentity() { return identity; }
    public void setIdentity(String identity) { this.identity = identity; }
    public String getParticipantName() { return participantName; }
    public void setParticipantName(String participantName) { this.participantName = participantName; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}

