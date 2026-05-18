package com.School.School_management.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "opening_hours")
public class OpeningHour {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(nullable = false)
    private boolean status = true;

    // Monday
    @Column(name = "monday_enabled", nullable = false)
    private boolean mondayEnabled;
    @Column(name = "monday_start")
    private String mondayStart;
    @Column(name = "monday_end")
    private String mondayEnd;

    // Tuesday
    @Column(name = "tuesday_enabled", nullable = false)
    private boolean tuesdayEnabled;
    @Column(name = "tuesday_start")
    private String tuesdayStart;
    @Column(name = "tuesday_end")
    private String tuesdayEnd;

    // Wednesday
    @Column(name = "wednesday_enabled", nullable = false)
    private boolean wednesdayEnabled;
    @Column(name = "wednesday_start")
    private String wednesdayStart;
    @Column(name = "wednesday_end")
    private String wednesdayEnd;

    // Thursday
    @Column(name = "thursday_enabled", nullable = false)
    private boolean thursdayEnabled;
    @Column(name = "thursday_start")
    private String thursdayStart;
    @Column(name = "thursday_end")
    private String thursdayEnd;

    // Friday
    @Column(name = "friday_enabled", nullable = false)
    private boolean fridayEnabled;
    @Column(name = "friday_start")
    private String fridayStart;
    @Column(name = "friday_end")
    private String fridayEnd;

    // Saturday
    @Column(name = "saturday_enabled", nullable = false)
    private boolean saturdayEnabled;
    @Column(name = "saturday_start")
    private String saturdayStart;
    @Column(name = "saturday_end")
    private String saturdayEnd;

    // Sunday
    @Column(name = "sunday_enabled", nullable = false)
    private boolean sundayEnabled;
    @Column(name = "sunday_start")
    private String sundayStart;
    @Column(name = "sunday_end")
    private String sundayEnd;

    public OpeningHour() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public boolean getStatus() { return status; }
    public void setStatus(boolean status) { this.status = status; }

    // Monday
    public boolean getMondayEnabled() { return mondayEnabled; }
    public void setMondayEnabled(boolean mondayEnabled) { this.mondayEnabled = mondayEnabled; }
    public String getMondayStart() { return mondayStart; }
    public void setMondayStart(String mondayStart) { this.mondayStart = mondayStart; }
    public String getMondayEnd() { return mondayEnd; }
    public void setMondayEnd(String mondayEnd) { this.mondayEnd = mondayEnd; }

    // Tuesday
    public boolean getTuesdayEnabled() { return tuesdayEnabled; }
    public void setTuesdayEnabled(boolean tuesdayEnabled) { this.tuesdayEnabled = tuesdayEnabled; }
    public String getTuesdayStart() { return tuesdayStart; }
    public void setTuesdayStart(String tuesdayStart) { this.tuesdayStart = tuesdayStart; }
    public String getTuesdayEnd() { return tuesdayEnd; }
    public void setTuesdayEnd(String tuesdayEnd) { this.tuesdayEnd = tuesdayEnd; }

    // Wednesday
    public boolean getWednesdayEnabled() { return wednesdayEnabled; }
    public void setWednesdayEnabled(boolean wednesdayEnabled) { this.wednesdayEnabled = wednesdayEnabled; }
    public String getWednesdayStart() { return wednesdayStart; }
    public void setWednesdayStart(String wednesdayStart) { this.wednesdayStart = wednesdayStart; }
    public String getWednesdayEnd() { return wednesdayEnd; }
    public void setWednesdayEnd(String wednesdayEnd) { this.wednesdayEnd = wednesdayEnd; }

    // Thursday
    public boolean getThursdayEnabled() { return thursdayEnabled; }
    public void setThursdayEnabled(boolean thursdayEnabled) { this.thursdayEnabled = thursdayEnabled; }
    public String getThursdayStart() { return thursdayStart; }
    public void setThursdayStart(String thursdayStart) { this.thursdayStart = thursdayStart; }
    public String getThursdayEnd() { return thursdayEnd; }
    public void setThursdayEnd(String thursdayEnd) { this.thursdayEnd = thursdayEnd; }

    // Friday
    public boolean getFridayEnabled() { return fridayEnabled; }
    public void setFridayEnabled(boolean fridayEnabled) { this.fridayEnabled = fridayEnabled; }
    public String getFridayStart() { return fridayStart; }
    public void setFridayStart(String fridayStart) { this.fridayStart = fridayStart; }
    public String getFridayEnd() { return fridayEnd; }
    public void setFridayEnd(String fridayEnd) { this.fridayEnd = fridayEnd; }

    // Saturday
    public boolean getSaturdayEnabled() { return saturdayEnabled; }
    public void setSaturdayEnabled(boolean saturdayEnabled) { this.saturdayEnabled = saturdayEnabled; }
    public String getSaturdayStart() { return saturdayStart; }
    public void setSaturdayStart(String saturdayStart) { this.saturdayStart = saturdayStart; }
    public String getSaturdayEnd() { return saturdayEnd; }
    public void setSaturdayEnd(String saturdayEnd) { this.saturdayEnd = saturdayEnd; }

    // Sunday
    public boolean getSundayEnabled() { return sundayEnabled; }
    public void setSundayEnabled(boolean sundayEnabled) { this.sundayEnabled = sundayEnabled; }
    public String getSundayStart() { return sundayStart; }
    public void setSundayStart(String sundayStart) { this.sundayStart = sundayStart; }
    public String getSundayEnd() { return sundayEnd; }
    public void setSundayEnd(String sundayEnd) { this.sundayEnd = sundayEnd; }
}
