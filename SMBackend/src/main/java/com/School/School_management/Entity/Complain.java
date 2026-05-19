package com.School.School_management.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "complains")
public class Complain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "academic_year", nullable = false)
    private String academicYear;

    @Column(name = "user_type", nullable = false)
    private String userType;

    @Column(name = "complain_by", nullable = false)
    private String complainBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private ManageTeacher teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complain_type_id")
    private ComplainType complainType;

    @Column(name = "complain_date", nullable = false)
    private LocalDate complainDate;

    @Column(name = "action_date")
    private LocalDate actionDate;

    @Column(columnDefinition = "TEXT")
    private String complain;

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

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }

    public String getComplainBy() { return complainBy; }
    public void setComplainBy(String complainBy) { this.complainBy = complainBy; }

    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }

    public ManageTeacher getTeacher() { return teacher; }
    public void setTeacher(ManageTeacher teacher) { this.teacher = teacher; }

    public ComplainType getComplainType() { return complainType; }
    public void setComplainType(ComplainType complainType) { this.complainType = complainType; }

    public LocalDate getComplainDate() { return complainDate; }
    public void setComplainDate(LocalDate complainDate) { this.complainDate = complainDate; }

    public LocalDate getActionDate() { return actionDate; }
    public void setActionDate(LocalDate actionDate) { this.actionDate = actionDate; }

    public String getComplain() { return complain; }
    public void setComplain(String complain) { this.complain = complain; }

    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
