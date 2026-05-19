package com.School.School_management.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscription_plans")
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plan_name", nullable = false)
    private String planName;

    @Column(name = "price")
    private Double price;

    @Column(name = "student_limit")
    private String studentLimit;

    @Column(name = "guardian_limit")
    private String guardianLimit;

    @Column(name = "teacher_limit")
    private String teacherLimit;

    @Column(name = "employee_limit")
    private String employeeLimit;

    @Column(name = "status")
    private String status;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted")
    private boolean deleted = false;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null || this.status.isBlank()) {
            this.status = "Active";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPlanName() { return planName; }
    public void setPlanName(String planName) { this.planName = planName; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    public String getStudentLimit() { return studentLimit; }
    public void setStudentLimit(String studentLimit) { this.studentLimit = studentLimit; }
    public String getGuardianLimit() { return guardianLimit; }
    public void setGuardianLimit(String guardianLimit) { this.guardianLimit = guardianLimit; }
    public String getTeacherLimit() { return teacherLimit; }
    public void setTeacherLimit(String teacherLimit) { this.teacherLimit = teacherLimit; }
    public String getEmployeeLimit() { return employeeLimit; }
    public void setEmployeeLimit(String employeeLimit) { this.employeeLimit = employeeLimit; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
}
