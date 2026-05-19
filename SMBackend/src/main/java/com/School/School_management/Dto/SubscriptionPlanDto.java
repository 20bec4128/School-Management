package com.School.School_management.Dto;

import java.time.LocalDateTime;

public class SubscriptionPlanDto {
    private Long id;
    private String planName;
    private Double price;
    private String studentLimit;
    private String guardianLimit;
    private String teacherLimit;
    private String employeeLimit;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

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
}
