// com/School/School_management/Entity/Student.java
package com.School.School_management.Entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.Date;

@Entity
@Table(name = "students")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private ManageSchool school;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "admission_no", nullable = false, unique = true)
    private String admissionNo;

    @Column(name = "admission_date")
    private LocalDate admissionDate;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "gender")
    private String gender;

    @Column(name = "blood_group")
    private String bloodGroup;

    @Column(name = "religion")
    private String religion;

    @Column(name = "caste")
    private String caste;

    @Column(name = "phone")
    private String phone;

    @Column(name = "email")
    private String email;

    @Column(name = "national_id")
    private String nationalId;

    @Column(name = "student_type")
    private String studentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private SchoolClass schoolClass;

    @Column(name = "class_name")
    private String className;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id")
    private SchoolSection schoolSection;

    @Column(name = "section")
    private String section;

    @Column(name = "group_name")
    private String groupName;

    @Column(name = "roll_no")
    private String rollNo;

    @Column(name = "registration_no")
    private String registrationNo;

    @Column(name = "discount")
    private String discount;

    @Column(name = "second_language")
    private String secondLanguage;

    // Guardian Information
    @Column(name = "is_guardian")
    private String isGuardian;

    @Column(name = "relation_with_guardian")
    private String relationWithGuardian;

    // Father Information
    @Column(name = "father_name")
    private String fatherName;

    @Column(name = "father_phone")
    private String fatherPhone;

    @Column(name = "father_education")
    private String fatherEducation;

    @Column(name = "father_profession")
    private String fatherProfession;

    @Column(name = "father_designation")
    private String fatherDesignation;

    @Column(name = "father_photo_url")
    private String fatherPhotoUrl;

    @Column(name = "father_email")
    private String fatherEmail;

    // Mother Information
    @Column(name = "mother_name")
    private String motherName;

    @Column(name = "mother_phone")
    private String motherPhone;

    @Column(name = "mother_education")
    private String motherEducation;

    @Column(name = "mother_profession")
    private String motherProfession;

    @Column(name = "mother_designation")
    private String motherDesignation;

    @Column(name = "mother_photo_url")
    private String motherPhotoUrl;

    @Column(name = "mother_email")
    private String motherEmail;

    @Column(name = "guardian_email")
    private String guardianEmail;

    // Address Information
    @Column(name = "present_address", columnDefinition = "TEXT")
    private String presentAddress;

    @Column(name = "permanent_address", columnDefinition = "TEXT")
    private String permanentAddress;

    @Column(name = "same_as_guardian_address")
    private Boolean sameAsGuardianAddress = false;

    // Previous School Information
    @Column(name = "previous_school_name")
    private String previousSchoolName;

    @Column(name = "previous_class")
    private String previousClass;

    @Column(name = "transfer_certificate_url")
    private String transferCertificateUrl;

    // Login Information
    @Column(name = "username", nullable = false, unique = true)
    private String username;

    @Column(name = "password", nullable = false)
    private String password;

    // Other Information
    @Column(name = "health_condition")
    private String healthCondition;

    @Column(name = "other_info", columnDefinition = "TEXT")
    private String otherInfo;

    @Column(name = "photo_url")
    private String photoUrl;

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

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ManageSchool getSchool() { return school; }
    public void setSchool(ManageSchool school) { this.school = school; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAdmissionNo() { return admissionNo; }
    public void setAdmissionNo(String admissionNo) { this.admissionNo = admissionNo; }

    public LocalDate getAdmissionDate() { return admissionDate; }
    public void setAdmissionDate(LocalDate admissionDate) { this.admissionDate = admissionDate; }

    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public String getReligion() { return religion; }
    public void setReligion(String religion) { this.religion = religion; }

    public String getCaste() { return caste; }
    public void setCaste(String caste) { this.caste = caste; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getNationalId() { return nationalId; }
    public void setNationalId(String nationalId) { this.nationalId = nationalId; }

    public String getStudentType() { return studentType; }
    public void setStudentType(String studentType) { this.studentType = studentType; }

    public SchoolClass getSchoolClass() { return schoolClass; }
    public void setSchoolClass(SchoolClass schoolClass) { this.schoolClass = schoolClass; }

    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }

    public SchoolSection getSchoolSection() { return schoolSection; }
    public void setSchoolSection(SchoolSection schoolSection) { this.schoolSection = schoolSection; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }

    public String getRollNo() { return rollNo; }
    public void setRollNo(String rollNo) { this.rollNo = rollNo; }

    public String getRegistrationNo() { return registrationNo; }
    public void setRegistrationNo(String registrationNo) { this.registrationNo = registrationNo; }

    public String getDiscount() { return discount; }
    public void setDiscount(String discount) { this.discount = discount; }

    public String getSecondLanguage() { return secondLanguage; }
    public void setSecondLanguage(String secondLanguage) { this.secondLanguage = secondLanguage; }

    public String getIsGuardian() { return isGuardian; }
    public void setIsGuardian(String isGuardian) { this.isGuardian = isGuardian; }

    public String getRelationWithGuardian() { return relationWithGuardian; }
    public void setRelationWithGuardian(String relationWithGuardian) { this.relationWithGuardian = relationWithGuardian; }

    public String getFatherName() { return fatherName; }
    public void setFatherName(String fatherName) { this.fatherName = fatherName; }

    public String getFatherPhone() { return fatherPhone; }
    public void setFatherPhone(String fatherPhone) { this.fatherPhone = fatherPhone; }

    public String getFatherEducation() { return fatherEducation; }
    public void setFatherEducation(String fatherEducation) { this.fatherEducation = fatherEducation; }

    public String getFatherProfession() { return fatherProfession; }
    public void setFatherProfession(String fatherProfession) { this.fatherProfession = fatherProfession; }

    public String getFatherDesignation() { return fatherDesignation; }
    public void setFatherDesignation(String fatherDesignation) { this.fatherDesignation = fatherDesignation; }

    public String getFatherPhotoUrl() { return fatherPhotoUrl; }
    public void setFatherPhotoUrl(String fatherPhotoUrl) { this.fatherPhotoUrl = fatherPhotoUrl; }
    public String getFatherEmail() { return fatherEmail; }
    public void setFatherEmail(String fatherEmail) { this.fatherEmail = fatherEmail; }

    public String getMotherName() { return motherName; }
    public void setMotherName(String motherName) { this.motherName = motherName; }

    public String getMotherPhone() { return motherPhone; }
    public void setMotherPhone(String motherPhone) { this.motherPhone = motherPhone; }

    public String getMotherEducation() { return motherEducation; }
    public void setMotherEducation(String motherEducation) { this.motherEducation = motherEducation; }

    public String getMotherProfession() { return motherProfession; }
    public void setMotherProfession(String motherProfession) { this.motherProfession = motherProfession; }

    public String getMotherDesignation() { return motherDesignation; }
    public void setMotherDesignation(String motherDesignation) { this.motherDesignation = motherDesignation; }

    public String getMotherPhotoUrl() { return motherPhotoUrl; }
    public void setMotherPhotoUrl(String motherPhotoUrl) { this.motherPhotoUrl = motherPhotoUrl; }
    public String getMotherEmail() { return motherEmail; }
    public void setMotherEmail(String motherEmail) { this.motherEmail = motherEmail; }
    public String getGuardianEmail() { return guardianEmail; }
    public void setGuardianEmail(String guardianEmail) { this.guardianEmail = guardianEmail; }

    public String getPresentAddress() { return presentAddress; }
    public void setPresentAddress(String presentAddress) { this.presentAddress = presentAddress; }

    public String getPermanentAddress() { return permanentAddress; }
    public void setPermanentAddress(String permanentAddress) { this.permanentAddress = permanentAddress; }

    public Boolean getSameAsGuardianAddress() { return sameAsGuardianAddress; }
    public void setSameAsGuardianAddress(Boolean sameAsGuardianAddress) { this.sameAsGuardianAddress = sameAsGuardianAddress; }

    public String getPreviousSchoolName() { return previousSchoolName; }
    public void setPreviousSchoolName(String previousSchoolName) { this.previousSchoolName = previousSchoolName; }

    public String getPreviousClass() { return previousClass; }
    public void setPreviousClass(String previousClass) { this.previousClass = previousClass; }

    public String getTransferCertificateUrl() { return transferCertificateUrl; }
    public void setTransferCertificateUrl(String transferCertificateUrl) { this.transferCertificateUrl = transferCertificateUrl; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getHealthCondition() { return healthCondition; }
    public void setHealthCondition(String healthCondition) { this.healthCondition = healthCondition; }

    public String getOtherInfo() { return otherInfo; }
    public void setOtherInfo(String otherInfo) { this.otherInfo = otherInfo; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }

    public Boolean getDeleted() { return deleted; }
    public void setDeleted(Boolean deleted) { this.deleted = deleted; }

    // Builder pattern
    public static StudentBuilder builder() {
        return new StudentBuilder();
    }

    public static class StudentBuilder {
        private Student student = new Student();

        public StudentBuilder id(Long id) { student.setId(id); return this; }
        public StudentBuilder school(ManageSchool school) { student.setSchool(school); return this; }
        public StudentBuilder name(String name) { student.setName(name); return this; }
        public StudentBuilder admissionNo(String admissionNo) { student.setAdmissionNo(admissionNo); return this; }
        public StudentBuilder admissionDate(LocalDate admissionDate) { student.setAdmissionDate(admissionDate); return this; }
        public StudentBuilder birthDate(LocalDate birthDate) { student.setBirthDate(birthDate); return this; }
        public StudentBuilder gender(String gender) { student.setGender(gender); return this; }
        public StudentBuilder bloodGroup(String bloodGroup) { student.setBloodGroup(bloodGroup); return this; }
        public StudentBuilder religion(String religion) { student.setReligion(religion); return this; }
        public StudentBuilder caste(String caste) { student.setCaste(caste); return this; }
        public StudentBuilder phone(String phone) { student.setPhone(phone); return this; }
        public StudentBuilder email(String email) { student.setEmail(email); return this; }
        public StudentBuilder nationalId(String nationalId) { student.setNationalId(nationalId); return this; }
        public StudentBuilder studentType(String studentType) { student.setStudentType(studentType); return this; }
        public StudentBuilder schoolClass(SchoolClass schoolClass) { student.setSchoolClass(schoolClass); return this; }
        public StudentBuilder className(String className) { student.setClassName(className); return this; }
        public StudentBuilder schoolSection(SchoolSection schoolSection) { student.setSchoolSection(schoolSection); return this; }
        public StudentBuilder section(String section) { student.setSection(section); return this; }
        public StudentBuilder groupName(String groupName) { student.setGroupName(groupName); return this; }
        public StudentBuilder rollNo(String rollNo) { student.setRollNo(rollNo); return this; }
        public StudentBuilder registrationNo(String registrationNo) { student.setRegistrationNo(registrationNo); return this; }
        public StudentBuilder discount(String discount) { student.setDiscount(discount); return this; }
        public StudentBuilder secondLanguage(String secondLanguage) { student.setSecondLanguage(secondLanguage); return this; }
        public StudentBuilder isGuardian(String isGuardian) { student.setIsGuardian(isGuardian); return this; }
        public StudentBuilder relationWithGuardian(String relationWithGuardian) { student.setRelationWithGuardian(relationWithGuardian); return this; }
        public StudentBuilder fatherName(String fatherName) { student.setFatherName(fatherName); return this; }
        public StudentBuilder fatherPhone(String fatherPhone) { student.setFatherPhone(fatherPhone); return this; }
        public StudentBuilder fatherEducation(String fatherEducation) { student.setFatherEducation(fatherEducation); return this; }
        public StudentBuilder fatherProfession(String fatherProfession) { student.setFatherProfession(fatherProfession); return this; }
        public StudentBuilder fatherDesignation(String fatherDesignation) { student.setFatherDesignation(fatherDesignation); return this; }
        public StudentBuilder fatherPhotoUrl(String fatherPhotoUrl) { student.setFatherPhotoUrl(fatherPhotoUrl); return this; }
        public StudentBuilder fatherEmail(String fatherEmail) { student.setFatherEmail(fatherEmail); return this; }
        public StudentBuilder motherName(String motherName) { student.setMotherName(motherName); return this; }
        public StudentBuilder motherPhone(String motherPhone) { student.setMotherPhone(motherPhone); return this; }
        public StudentBuilder motherEducation(String motherEducation) { student.setMotherEducation(motherEducation); return this; }
        public StudentBuilder motherProfession(String motherProfession) { student.setMotherProfession(motherProfession); return this; }
        public StudentBuilder motherDesignation(String motherDesignation) { student.setMotherDesignation(motherDesignation); return this; }
        public StudentBuilder motherPhotoUrl(String motherPhotoUrl) { student.setMotherPhotoUrl(motherPhotoUrl); return this; }
        public StudentBuilder motherEmail(String motherEmail) { student.setMotherEmail(motherEmail); return this; }
        public StudentBuilder guardianEmail(String guardianEmail) { student.setGuardianEmail(guardianEmail); return this; }
        public StudentBuilder presentAddress(String presentAddress) { student.setPresentAddress(presentAddress); return this; }
        public StudentBuilder permanentAddress(String permanentAddress) { student.setPermanentAddress(permanentAddress); return this; }
        public StudentBuilder sameAsGuardianAddress(Boolean sameAsGuardianAddress) { student.setSameAsGuardianAddress(sameAsGuardianAddress); return this; }
        public StudentBuilder previousSchoolName(String previousSchoolName) { student.setPreviousSchoolName(previousSchoolName); return this; }
        public StudentBuilder previousClass(String previousClass) { student.setPreviousClass(previousClass); return this; }
        public StudentBuilder transferCertificateUrl(String transferCertificateUrl) { student.setTransferCertificateUrl(transferCertificateUrl); return this; }
        public StudentBuilder username(String username) { student.setUsername(username); return this; }
        public StudentBuilder password(String password) { student.setPassword(password); return this; }
        public StudentBuilder healthCondition(String healthCondition) { student.setHealthCondition(healthCondition); return this; }
        public StudentBuilder otherInfo(String otherInfo) { student.setOtherInfo(otherInfo); return this; }
        public StudentBuilder photoUrl(String photoUrl) { student.setPhotoUrl(photoUrl); return this; }

        public Student build() { return student; }
    }
}
