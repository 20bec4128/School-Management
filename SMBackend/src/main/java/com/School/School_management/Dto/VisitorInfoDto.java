package com.School.School_management.Dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class VisitorInfoDto {
    private Long id;
    private Long schoolId;
    private Long purposeId;
    private String purposeName;
    private String name;
    private String phone;
    private String comingFrom;
    private String idCard;
    private Integer numOfPerson;
    private LocalDate date;
    private LocalTime inTime;
    private LocalTime outTime;
    private String note;
    private String filePath;

    public VisitorInfoDto() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public Long getPurposeId() { return purposeId; }
    public void setPurposeId(Long purposeId) { this.purposeId = purposeId; }

    public String getPurposeName() { return purposeName; }
    public void setPurposeName(String purposeName) { this.purposeName = purposeName; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getComingFrom() { return comingFrom; }
    public void setComingFrom(String comingFrom) { this.comingFrom = comingFrom; }

    public String getIdCard() { return idCard; }
    public void setIdCard(String idCard) { this.idCard = idCard; }

    public Integer getNumOfPerson() { return numOfPerson; }
    public void setNumOfPerson(Integer numOfPerson) { this.numOfPerson = numOfPerson; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public LocalTime getInTime() { return inTime; }
    public void setInTime(LocalTime inTime) { this.inTime = inTime; }

    public LocalTime getOutTime() { return outTime; }
    public void setOutTime(LocalTime outTime) { this.outTime = outTime; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
}
