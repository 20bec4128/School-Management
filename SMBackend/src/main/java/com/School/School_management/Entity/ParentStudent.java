package com.School.School_management.Entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "parent_students")
public class ParentStudent {

    @EmbeddedId
    private ParentStudentKey id;

    public ParentStudent() {}

    public ParentStudent(ParentStudentKey id) {
        this.id = id;
    }

    public ParentStudentKey getId() {
        return id;
    }

    public void setId(ParentStudentKey id) {
        this.id = id;
    }
}

