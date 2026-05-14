package com.School.School_management.Dto;

import java.time.LocalDateTime;

public class VehicleDto {
    private Long id;
    private Long schoolId;
    private String schoolName;
    private Long driverEmployeeId;
    private String driverEmployeeName;
    private String vehicleNumber;
    private String vehicleModel;
    private String vehicleLicense;
    private String vehicleContactCountryCode;
    private String vehicleContactNumber;
    private String note;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public String getSchoolName() { return schoolName; }
    public void setSchoolName(String schoolName) { this.schoolName = schoolName; }

    public Long getDriverEmployeeId() { return driverEmployeeId; }
    public void setDriverEmployeeId(Long driverEmployeeId) { this.driverEmployeeId = driverEmployeeId; }

    public String getDriverEmployeeName() { return driverEmployeeName; }
    public void setDriverEmployeeName(String driverEmployeeName) { this.driverEmployeeName = driverEmployeeName; }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public String getVehicleModel() { return vehicleModel; }
    public void setVehicleModel(String vehicleModel) { this.vehicleModel = vehicleModel; }

    public String getVehicleLicense() { return vehicleLicense; }
    public void setVehicleLicense(String vehicleLicense) { this.vehicleLicense = vehicleLicense; }

    public String getVehicleContactCountryCode() { return vehicleContactCountryCode; }
    public void setVehicleContactCountryCode(String vehicleContactCountryCode) { this.vehicleContactCountryCode = vehicleContactCountryCode; }

    public String getVehicleContactNumber() { return vehicleContactNumber; }
    public void setVehicleContactNumber(String vehicleContactNumber) { this.vehicleContactNumber = vehicleContactNumber; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
