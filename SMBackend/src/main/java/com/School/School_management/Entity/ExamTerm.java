package com.School.School_management.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "exam_terms")
public class ExamTerm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "grade_name", nullable = false)
    private String gradeName;

    @Column(name = "grade_point", nullable = false)
    private Double gradePoint;

    @Column(name = "mark_from", nullable = false)
    private Integer markFrom;

    @Column(name = "mark_to", nullable = false)
    private Integer markTo;

    @Column(columnDefinition = "TEXT")
    private String note;

    public ExamTerm() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSchoolId() {
        return schoolId;
    }

    public void setSchoolId(Long schoolId) {
        this.schoolId = schoolId;
    }

    public String getGradeName() {
        return gradeName;
    }

    public void setGradeName(String gradeName) {
        this.gradeName = gradeName;
    }

    public Double getGradePoint() {
        return gradePoint;
    }

    public void setGradePoint(Double gradePoint) {
        this.gradePoint = gradePoint;
    }

    public Integer getMarkFrom() {
        return markFrom;
    }

    public void setMarkFrom(Integer markFrom) {
        this.markFrom = markFrom;
    }

    public Integer getMarkTo() {
        return markTo;
    }

    public void setMarkTo(Integer markTo) {
        this.markTo = markTo;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
