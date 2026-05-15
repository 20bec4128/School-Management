package com.School.School_management.Dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class SaleDto {
    private Long id;
    private Long headOfficeId;
    private String headOfficeName;
    private Long schoolId;
    private String schoolName;
    private String invoiceNumber;
    private String userType;
    private Long saleToId;
    private String saleToName;
    private Long incomeHeadId;
    private String incomeHeadName;
    private LocalDate saleDate;
    private BigDecimal grossAmount;
    private BigDecimal discountAmount;
    private BigDecimal netAmount;
    private String status;
    private String note;
    private List<SaleItemDto> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

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
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }
    public Long getSaleToId() { return saleToId; }
    public void setSaleToId(Long saleToId) { this.saleToId = saleToId; }
    public String getSaleToName() { return saleToName; }
    public void setSaleToName(String saleToName) { this.saleToName = saleToName; }
    public Long getIncomeHeadId() { return incomeHeadId; }
    public void setIncomeHeadId(Long incomeHeadId) { this.incomeHeadId = incomeHeadId; }
    public String getIncomeHeadName() { return incomeHeadName; }
    public void setIncomeHeadName(String incomeHeadName) { this.incomeHeadName = incomeHeadName; }
    public LocalDate getSaleDate() { return saleDate; }
    public void setSaleDate(LocalDate saleDate) { this.saleDate = saleDate; }
    public BigDecimal getGrossAmount() { return grossAmount; }
    public void setGrossAmount(BigDecimal grossAmount) { this.grossAmount = grossAmount; }
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
    public BigDecimal getNetAmount() { return netAmount; }
    public void setNetAmount(BigDecimal netAmount) { this.netAmount = netAmount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public List<SaleItemDto> getItems() { return items; }
    public void setItems(List<SaleItemDto> items) { this.items = items; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
