package com.School.School_management.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "student_types")
public class Studenttype {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private ManageSchool school;

    @Column(name = "student_type", nullable = false)
    private String studentType;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    public Studenttype() {
    }

    public Studenttype(Long id, ManageSchool school, String studentType, String note) {
        this.id = id;
        this.school = school;
        this.studentType = studentType;
        this.note = note;
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

    public String getStudentType() {
        return studentType;
    }

    public void setStudentType(String studentType) {
        this.studentType = studentType;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public static StudenttypeBuilder builder() {
        return new StudenttypeBuilder();
    }

    public static class StudenttypeBuilder {
        private Long id;
        private ManageSchool school;
        private String studentType;
        private String note;

        public StudenttypeBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public StudenttypeBuilder school(ManageSchool school) {
            this.school = school;
            return this;
        }

        public StudenttypeBuilder studentType(String studentType) {
            this.studentType = studentType;
            return this;
        }

        public StudenttypeBuilder note(String note) {
            this.note = note;
            return this;
        }

        public Studenttype build() {
            Studenttype studenttype = new Studenttype();
            studenttype.setId(this.id);
            studenttype.setSchool(this.school);
            studenttype.setStudentType(this.studentType);
            studenttype.setNote(this.note);
            return studenttype;
        }
    }
}
