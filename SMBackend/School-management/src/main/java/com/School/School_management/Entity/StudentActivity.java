// com/School/School_management/Entity/StudentActivity.java
package com.School.School_management.Entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.Date;

@Entity
@Table(name = "student_activities")
public class StudentActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private ManageSchool school;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "class_name", nullable = false)
    private String className;

    @Column(name = "section", nullable = false)
    private String section;

    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate;

    @Column(name = "activity_name", nullable = false)
    private String activityName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // Audit fields
    @Column(name = "created_at", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;

    @Column(name = "deleted")
    private Boolean deleted = false;

    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
        updatedAt = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = new Date();
    }

    // Getters and Setters - Generate in Eclipse
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ManageSchool getSchool() { return school; }
    public void setSchool(ManageSchool school) { this.school = school; }

    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }

    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public LocalDate getActivityDate() { return activityDate; }
    public void setActivityDate(LocalDate activityDate) { this.activityDate = activityDate; }

    public String getActivityName() { return activityName; }
    public void setActivityName(String activityName) { this.activityName = activityName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }

    public Boolean getDeleted() { return deleted; }
    public void setDeleted(Boolean deleted) { this.deleted = deleted; }
}