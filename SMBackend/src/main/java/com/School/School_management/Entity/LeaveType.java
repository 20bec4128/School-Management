package com.School.School_management.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "leave_types")
public class LeaveType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private ManageSchool school;

    @Column(name = "designation_id")
    private Long designationId;

    @Column(name = "applicant_type", nullable = false)
    private String applicantType;

    @Column(name = "leave_type", nullable = false)
    private String leaveType;

    @Column(name = "allowed_leaves_per_year", nullable = false)
    private Integer allowedLeavesPerYear;

    public LeaveType() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ManageSchool getSchool() {
        return school;
    }

    public void setSchool(ManageSchool school) {
        this.school = school;
    }

    public Long getDesignationId() {
        return designationId;
    }

    public void setDesignationId(Long designationId) {
        this.designationId = designationId;
    }

    public String getApplicantType() {
        return applicantType;
    }

    public void setApplicantType(String applicantType) {
        this.applicantType = applicantType;
    }

    public String getLeaveType() {
        return leaveType;
    }

    public void setLeaveType(String leaveType) {
        this.leaveType = leaveType;
    }

    public Integer getAllowedLeavesPerYear() {
        return allowedLeavesPerYear;
    }

    public void setAllowedLeavesPerYear(Integer allowedLeavesPerYear) {
        this.allowedLeavesPerYear = allowedLeavesPerYear;
    }
}
