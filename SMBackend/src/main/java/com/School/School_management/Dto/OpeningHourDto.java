package com.School.School_management.Dto;

public class OpeningHourDto {
    private Long id;
    private Long schoolId;
    private String schoolName;
    private boolean status = true;

    // Monday
    private boolean mondayEnabled;
    private String mondayStart;
    private String mondayEnd;

    // Tuesday
    private boolean tuesdayEnabled;
    private String tuesdayStart;
    private String tuesdayEnd;

    // Wednesday
    private boolean wednesdayEnabled;
    private String wednesdayStart;
    private String wednesdayEnd;

    // Thursday
    private boolean thursdayEnabled;
    private String thursdayStart;
    private String thursdayEnd;

    // Friday
    private boolean fridayEnabled;
    private String fridayStart;
    private String fridayEnd;

    // Saturday
    private boolean saturdayEnabled;
    private String saturdayStart;
    private String saturdayEnd;

    // Sunday
    private boolean sundayEnabled;
    private String sundayStart;
    private String sundayEnd;

    public OpeningHourDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public String getSchoolName() { return schoolName; }
    public void setSchoolName(String schoolName) { this.schoolName = schoolName; }

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
