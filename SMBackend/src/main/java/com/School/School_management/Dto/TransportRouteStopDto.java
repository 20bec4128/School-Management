package com.School.School_management.Dto;

import java.math.BigDecimal;

public class TransportRouteStopDto {
    private Long id;
    private Integer stopOrder;
    private String stopName;
    private BigDecimal stopKm;
    private BigDecimal stopFare;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getStopOrder() { return stopOrder; }
    public void setStopOrder(Integer stopOrder) { this.stopOrder = stopOrder; }

    public String getStopName() { return stopName; }
    public void setStopName(String stopName) { this.stopName = stopName; }

    public BigDecimal getStopKm() { return stopKm; }
    public void setStopKm(BigDecimal stopKm) { this.stopKm = stopKm; }

    public BigDecimal getStopFare() { return stopFare; }
    public void setStopFare(BigDecimal stopFare) { this.stopFare = stopFare; }
}
