package com.School.School_management.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "sales")
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "head_office_id", nullable = false)
    private Long headOfficeId;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "invoice_number", nullable = false)
    private String invoiceNumber;

    @Column(name = "user_type", nullable = false)
    private String userType;

    @Column(name = "sale_to_id", nullable = false)
    private Long saleToId;

    @Column(name = "sale_to_name", nullable = false)
    private String saleToName;

    @Column(name = "income_head_id", nullable = false)
    private Long incomeHeadId;

    @Column(name = "income_head_name", nullable = false)
    private String incomeHeadName;

    @Column(name = "sale_date", nullable = false)
    private LocalDate saleDate;

    @Column(name = "gross_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal grossAmount;

    @Column(name = "discount_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "net_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal netAmount;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getHeadOfficeId() { return headOfficeId; }
    public void setHeadOfficeId(Long headOfficeId) { this.headOfficeId = headOfficeId; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
