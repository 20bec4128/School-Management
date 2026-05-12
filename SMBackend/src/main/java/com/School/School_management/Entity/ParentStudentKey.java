package com.School.School_management.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class ParentStudentKey implements Serializable {

    @Column(name = "parent_id")
    private Long parentId;

    @Column(name = "student_id")
    private Long studentId;

    public ParentStudentKey() {}

    public ParentStudentKey(Long parentId, Long studentId) {
        this.parentId = parentId;
        this.studentId = studentId;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ParentStudentKey that)) return false;
        return Objects.equals(parentId, that.parentId) && Objects.equals(studentId, that.studentId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(parentId, studentId);
    }
}

