package com.School.School_management.Dto;

import java.time.LocalDate;

public class CallLogDto {
    private Long id;
    private Long schoolId;
    private String name;
    private String phone;
    private LocalDate date;
    private LocalDate followUpDate;
    private String callDuration;
    private String callType;
    private String note;

    public CallLogDto() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public LocalDate getFollowUpDate() { return followUpDate; }
    public void setFollowUpDate(LocalDate followUpDate) { this.followUpDate = followUpDate; }

    public String getCallDuration() { return callDuration; }
    public void setCallDuration(String callDuration) { this.callDuration = callDuration; }

    public String getCallType() { return callType; }
    public void setCallType(String callType) { this.callType = callType; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
