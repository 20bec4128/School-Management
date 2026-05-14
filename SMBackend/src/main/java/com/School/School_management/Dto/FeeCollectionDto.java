package com.School.School_management.Dto;

import java.time.LocalDateTime;

public class FeeCollectionDto {
    private Long id;
    private Long schoolId;
    private String schoolName;
    private Long classId;
    private String className;
    private Long studentId;
    private String studentName;
    private Long feeTypeId;
    private String feeTypeTitle;
    private Double feeAmount;
    private String month;
    private Boolean isApplicableDiscount;
    private String paidStatus;
    private String note;
    private String invoiceNumber;
    private Double grossAmount;
    private Double discount;
    private Double netAmount;
    private Double dueAmount;
    private LocalDateTime createdAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public String getSchoolName() { return schoolName; }
    public void setSchoolName(String schoolName) { this.schoolName = schoolName; }

    public Long getClassId() { return classId; }
    public void setClassId(Long classId) { this.classId = classId; }

    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public Long getFeeTypeId() { return feeTypeId; }
    public void setFeeTypeId(Long feeTypeId) { this.feeTypeId = feeTypeId; }

    public String getFeeTypeTitle() { return feeTypeTitle; }
    public void setFeeTypeTitle(String feeTypeTitle) { this.feeTypeTitle = feeTypeTitle; }

    public Double getFeeAmount() { return feeAmount; }
    public void setFeeAmount(Double feeAmount) { this.feeAmount = feeAmount; }

    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }

    public Boolean getIsApplicableDiscount() { return isApplicableDiscount; }
    public void setIsApplicableDiscount(Boolean isApplicableDiscount) { this.isApplicableDiscount = isApplicableDiscount; }

    public String getPaidStatus() { return paidStatus; }
    public void setPaidStatus(String paidStatus) { this.paidStatus = paidStatus; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public Double getGrossAmount() { return grossAmount; }
    public void setGrossAmount(Double grossAmount) { this.grossAmount = grossAmount; }

    public Double getDiscount() { return discount; }
    public void setDiscount(Double discount) { this.discount = discount; }

    public Double getNetAmount() { return netAmount; }
    public void setNetAmount(Double netAmount) { this.netAmount = netAmount; }

    public Double getDueAmount() { return dueAmount; }
    public void setDueAmount(Double dueAmount) { this.dueAmount = dueAmount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
