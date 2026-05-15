package com.School.School_management.Dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class TransportRouteDto {
    private Long id;
    private Long headOfficeId;
    private String headOfficeName;
    private Long schoolId;
    private String schoolName;
    private Long vehicleId;
    private String vehicleName;
    private String vehicleNumber;
    private String vehicleModel;
    private String routeName;
    private String routeStart;
    private String routeEnd;
    private String note;
    private List<TransportRouteStopDto> stops = new ArrayList<>();
    private LocalDateTime createdAt;

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

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }

    public String getVehicleName() { return vehicleName; }
    public void setVehicleName(String vehicleName) { this.vehicleName = vehicleName; }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public String getVehicleModel() { return vehicleModel; }
    public void setVehicleModel(String vehicleModel) { this.vehicleModel = vehicleModel; }

    public String getRouteName() { return routeName; }
    public void setRouteName(String routeName) { this.routeName = routeName; }

    public String getRouteStart() { return routeStart; }
    public void setRouteStart(String routeStart) { this.routeStart = routeStart; }

    public String getRouteEnd() { return routeEnd; }
    public void setRouteEnd(String routeEnd) { this.routeEnd = routeEnd; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public List<TransportRouteStopDto> getStops() { return stops; }
    public void setStops(List<TransportRouteStopDto> stops) { this.stops = stops; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
