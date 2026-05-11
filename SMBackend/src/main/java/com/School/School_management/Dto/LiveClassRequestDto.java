package com.School.School_management.Dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class LiveClassRequestDto {
    private Long schoolId;
    private Long classId;
    private Long sectionId;
    private Long subjectId;
    private Long teacherId;
    private String liveClassType;
    private String meetingLink;
    private String meetingRoomUrl;
    private LocalDate classDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String note;
    private Boolean sendNotification;
    private String status;

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }
    public Long getClassId() { return classId; }
    public void setClassId(Long classId) { this.classId = classId; }
    public Long getSectionId() { return sectionId; }
    public void setSectionId(Long sectionId) { this.sectionId = sectionId; }
    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }
    public Long getTeacherId() { return teacherId; }
    public void setTeacherId(Long teacherId) { this.teacherId = teacherId; }
    public String getLiveClassType() { return liveClassType; }
    public void setLiveClassType(String liveClassType) { this.liveClassType = liveClassType; }
    public String getMeetingLink() { return meetingLink; }
    public void setMeetingLink(String meetingLink) { this.meetingLink = meetingLink; }
    public String getMeetingRoomUrl() { return meetingRoomUrl; }
    public void setMeetingRoomUrl(String meetingRoomUrl) { this.meetingRoomUrl = meetingRoomUrl; }
    public LocalDate getClassDate() { return classDate; }
    public void setClassDate(LocalDate classDate) { this.classDate = classDate; }
    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public Boolean getSendNotification() { return sendNotification; }
    public void setSendNotification(Boolean sendNotification) { this.sendNotification = sendNotification; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
