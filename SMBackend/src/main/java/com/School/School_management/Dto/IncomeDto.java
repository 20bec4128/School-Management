package com.School.School_management.Dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class IncomeDto {
    private Long id;
    private Long schoolId;
    private String schoolName;
    private Long incomeHeadId;
    private String incomeHeadName;
    private String incomeMethod;
    private Double amount;
    private LocalDate incomeDate;
    private String note;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }
    public String getSchoolName() { return schoolName; }
    public void setSchoolName(String schoolName) { this.schoolName = schoolName; }
    public Long getIncomeHeadId() { return incomeHeadId; }
    public void setIncomeHeadId(Long incomeHeadId) { this.incomeHeadId = incomeHeadId; }
    public String getIncomeHeadName() { return incomeHeadName; }
    public void setIncomeHeadName(String incomeHeadName) { this.incomeHeadName = incomeHeadName; }
    public String getIncomeMethod() { return incomeMethod; }
    public void setIncomeMethod(String incomeMethod) { this.incomeMethod = incomeMethod; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public LocalDate getIncomeDate() { return incomeDate; }
    public void setIncomeDate(LocalDate incomeDate) { this.incomeDate = incomeDate; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
