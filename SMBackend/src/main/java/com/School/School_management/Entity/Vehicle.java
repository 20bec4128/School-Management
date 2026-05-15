package com.School.School_management.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private ManageSchool school;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_employee_id", nullable = false)
    private Employee driverEmployee;

    @Column(name = "vehicle_number", nullable = false)
    private String vehicleNumber;

    @Column(name = "vehicle_model")
    private String vehicleModel;

    @Column(name = "vehicle_license")
    private String vehicleLicense;

    @Column(name = "vehicle_contact_country_code", nullable = false)
    private String vehicleContactCountryCode;

    @Column(name = "vehicle_contact_number", nullable = false)
    private String vehicleContactNumber;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted")
    private Boolean deleted = false;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ManageSchool getSchool() { return school; }
    public void setSchool(ManageSchool school) { this.school = school; }

    public Employee getDriverEmployee() { return driverEmployee; }
    public void setDriverEmployee(Employee driverEmployee) { this.driverEmployee = driverEmployee; }

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

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Boolean getDeleted() { return deleted; }
    public void setDeleted(Boolean deleted) { this.deleted = deleted; }
}
