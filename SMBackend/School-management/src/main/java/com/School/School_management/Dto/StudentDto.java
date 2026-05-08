package com.School.School_management.Dto;

import java.time.LocalDate;

public class StudentDto {

    public static class Request {
        private Long schoolId;
        private String name;
        private String admissionNo;
        private LocalDate admissionDate;
        private LocalDate birthDate;
        private String gender;
        private String bloodGroup;
        private String religion;
        private String caste;
        private String phone;
        private String email;
        private String nationalId;
        private String studentType;
        private Long classId;
        private String className;
        private Long sectionId;
        private String section;
        private String group;
        private String rollNo;
        private String registrationNo;
        private String discount;
        private String secondLanguage;
        private String isGuardian;
        private String relationWithGuardian;
        private String fatherName;
        private String fatherPhone;
        private String fatherEducation;
        private String fatherProfession;
        private String fatherDesignation;
        private String motherName;
        private String motherPhone;
        private String motherEducation;
        private String motherProfession;
        private String motherDesignation;
        private String presentAddress;
        private String permanentAddress;
        private Boolean sameAsGuardianAddress;
        private String previousSchoolName;
        private String previousClass;
        private String username;
        private String password;
        private String parentUsername;
        private String parentPassword;
        private String healthCondition;
        private String otherInfo;

        public Long getSchoolId() { return schoolId; }
        public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

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

        public Long getClassId() { return classId; }
        public void setClassId(Long classId) { this.classId = classId; }

        public String getClassName() { return className; }
        public void setClassName(String className) { this.className = className; }

        public Long getSectionId() { return sectionId; }
        public void setSectionId(Long sectionId) { this.sectionId = sectionId; }

        public String getSection() { return section; }
        public void setSection(String section) { this.section = section; }

        public String getGroup() { return group; }
        public void setGroup(String group) { this.group = group; }

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

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public String getParentUsername() { return parentUsername; }
        public void setParentUsername(String parentUsername) { this.parentUsername = parentUsername; }

        public String getParentPassword() { return parentPassword; }
        public void setParentPassword(String parentPassword) { this.parentPassword = parentPassword; }

        public String getHealthCondition() { return healthCondition; }
        public void setHealthCondition(String healthCondition) { this.healthCondition = healthCondition; }

        public String getOtherInfo() { return otherInfo; }
        public void setOtherInfo(String otherInfo) { this.otherInfo = otherInfo; }
    }

    public static class Response {
        private Long id;
        private Long schoolId;
        private String schoolName;
        private String name;
        private String admissionNo;
        private LocalDate admissionDate;
        private LocalDate birthDate;
        private String gender;
        private String bloodGroup;
        private String religion;
        private String caste;
        private String phone;
        private String email;
        private String nationalId;
        private String studentType;
        private Long classId;
        private String className;
        private Long sectionId;
        private String section;
        private String group;
        private String rollNo;
        private String registrationNo;
        private String discount;
        private String secondLanguage;
        private String isGuardian;
        private String relationWithGuardian;
        private String fatherName;
        private String fatherPhone;
        private String fatherEducation;
        private String fatherProfession;
        private String fatherDesignation;
        private String fatherPhotoUrl;
        private String motherName;
        private String motherPhone;
        private String motherEducation;
        private String motherProfession;
        private String motherDesignation;
        private String motherPhotoUrl;
        private String presentAddress;
        private String permanentAddress;
        private Boolean sameAsGuardianAddress;
        private String previousSchoolName;
        private String previousClass;
        private String transferCertificateUrl;
        private String username;
        private String parentUsername;
        private String healthCondition;
        private String otherInfo;
        private String photoUrl;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public Long getSchoolId() { return schoolId; }
        public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

        public String getSchoolName() { return schoolName; }
        public void setSchoolName(String schoolName) { this.schoolName = schoolName; }

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

        public Long getClassId() { return classId; }
        public void setClassId(Long classId) { this.classId = classId; }

        public String getClassName() { return className; }
        public void setClassName(String className) { this.className = className; }

        public Long getSectionId() { return sectionId; }
        public void setSectionId(Long sectionId) { this.sectionId = sectionId; }

        public String getSection() { return section; }
        public void setSection(String section) { this.section = section; }

        public String getGroup() { return group; }
        public void setGroup(String group) { this.group = group; }

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

        public String getParentUsername() { return parentUsername; }
        public void setParentUsername(String parentUsername) { this.parentUsername = parentUsername; }

        public String getHealthCondition() { return healthCondition; }
        public void setHealthCondition(String healthCondition) { this.healthCondition = healthCondition; }

        public String getOtherInfo() { return otherInfo; }
        public void setOtherInfo(String otherInfo) { this.otherInfo = otherInfo; }

        public String getPhotoUrl() { return photoUrl; }
        public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    }
}
