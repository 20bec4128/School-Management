package com.School.School_management.Entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "visitor_infos")
public class VisitorInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purpose_id")
    private VisitorPurpose purpose;

    @Column(nullable = false)
    private String name;

    private String phone;
    private String comingFrom;
    private String idCard;
    private Integer numOfPerson;
    
    @Column(nullable = false)
    private LocalDate date;
    
    private LocalTime inTime;
    private LocalTime outTime;
    
    @Column(columnDefinition = "TEXT")
    private String note;
    
    private String filePath;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public VisitorPurpose getPurpose() { return purpose; }
    public void setPurpose(VisitorPurpose purpose) { this.purpose = purpose; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getComingFrom() { return comingFrom; }
    public void setComingFrom(String comingFrom) { this.comingFrom = comingFrom; }

    public String getIdCard() { return idCard; }
    public void setIdCard(String idCard) { this.idCard = idCard; }

    public Integer getNumOfPerson() { return numOfPerson; }
    public void setNumOfPerson(Integer numOfPerson) { this.numOfPerson = numOfPerson; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public LocalTime getInTime() { return inTime; }
    public void setInTime(LocalTime inTime) { this.inTime = inTime; }

    public LocalTime getOutTime() { return outTime; }
    public void setOutTime(LocalTime outTime) { this.outTime = outTime; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }
}
