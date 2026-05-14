package com.School.School_management.Dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class RoomDto {
    private Long id;
    private Long headOfficeId;
    private String headOfficeName;
    private Long schoolId;
    private String schoolName;
    private Long hostelId;
    private String hostelName;
    private String roomNo;
    private String roomType;
    private Integer seatTotal;
    private BigDecimal costPerSeat;
    private String note;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getHeadOfficeId() { return headOfficeId; }
    public void setHeadOfficeId(Long headOfficeId) { this.headOfficeId = headOfficeId; }

    public String getHeadOfficeName() { return headOfficeName; }
    public void setHeadOfficeName(String headOfficeName) { this.headOfficeName = headOfficeName; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public String getSchoolName() { return schoolName; }
    public void setSchoolName(String schoolName) { this.schoolName = schoolName; }

    public Long getHostelId() { return hostelId; }
    public void setHostelId(Long hostelId) { this.hostelId = hostelId; }

    public String getHostelName() { return hostelName; }
    public void setHostelName(String hostelName) { this.hostelName = hostelName; }

    public String getRoomNo() { return roomNo; }
    public void setRoomNo(String roomNo) { this.roomNo = roomNo; }

    public String getRoomType() { return roomType; }
    public void setRoomType(String roomType) { this.roomType = roomType; }

    public Integer getSeatTotal() { return seatTotal; }
    public void setSeatTotal(Integer seatTotal) { this.seatTotal = seatTotal; }

    public BigDecimal getCostPerSeat() { return costPerSeat; }
    public void setCostPerSeat(BigDecimal costPerSeat) { this.costPerSeat = costPerSeat; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
