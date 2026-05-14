package com.School.School_management.Dto;

import java.time.LocalDate;

public class PostalReceiveDto {
    private Long id;
    private Long schoolId;
    private String fromTitle;
    private String referenceNo;
    private String address;
    private String toTitle;
    private LocalDate date;
    private String note;
    private String filePath;

    public PostalReceiveDto() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public String getFromTitle() { return fromTitle; }
    public void setFromTitle(String fromTitle) { this.fromTitle = fromTitle; }

    public String getReferenceNo() { return referenceNo; }
    public void setReferenceNo(String referenceNo) { this.referenceNo = referenceNo; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getToTitle() { return toTitle; }
    public void setToTitle(String toTitle) { this.toTitle = toTitle; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
}
