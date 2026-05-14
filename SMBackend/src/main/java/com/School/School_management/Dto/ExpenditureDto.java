package com.School.School_management.Dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class ExpenditureDto {
    private Long id;
    private Long schoolId;
    private String schoolName;
    private Long expenditureHeadId;
    private String expenditureHeadName;
    private String expenditureMethod;
    private String reference;
    private Double amount;
    private LocalDate expenditureDate;
    private String note;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public String getSchoolName() { return schoolName; }
    public void setSchoolName(String schoolName) { this.schoolName = schoolName; }

    public Long getExpenditureHeadId() { return expenditureHeadId; }
    public void setExpenditureHeadId(Long expenditureHeadId) { this.expenditureHeadId = expenditureHeadId; }

    public String getExpenditureHeadName() { return expenditureHeadName; }
    public void setExpenditureHeadName(String expenditureHeadName) { this.expenditureHeadName = expenditureHeadName; }

    public String getExpenditureMethod() { return expenditureMethod; }
    public void setExpenditureMethod(String expenditureMethod) { this.expenditureMethod = expenditureMethod; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public LocalDate getExpenditureDate() { return expenditureDate; }
    public void setExpenditureDate(LocalDate expenditureDate) { this.expenditureDate = expenditureDate; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
