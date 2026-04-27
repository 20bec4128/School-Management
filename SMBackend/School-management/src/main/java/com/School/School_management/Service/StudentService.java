// com/School/School_management/Service/StudentService.java
package com.School.School_management.Service;

import com.School.School_management.Dto.PaginationResponse;
import com.School.School_management.Dto.StudentDto;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.Student;
import com.School.School_management.Exception.StudentNotFoundException;
import com.School.School_management.Repository.StudentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;

    public StudentService(StudentRepository studentRepository, PasswordEncoder passwordEncoder) {
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public PaginationResponse<StudentDto.Response> getAll(int page, int size, 
                                                           Long schoolId, 
                                                           String className, 
                                                           String section, 
                                                           String groupName) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Student> studentPage;
        
        if (schoolId != null || className != null || section != null || groupName != null) {
            studentPage = studentRepository.searchStudents(schoolId, className, section, groupName, pageable);
        } else {
            studentPage = studentRepository.findByDeletedFalse(pageable);
        }
        
        Page<StudentDto.Response> responsePage = studentPage.map(this::toResponse);
        
        return new PaginationResponse<>(
            responsePage.getContent(),
            responsePage.getTotalPages(),
            responsePage.getTotalElements(),
            page,
            size,
            responsePage.hasNext(),
            responsePage.hasPrevious()
        );
    }

    @Transactional
    public StudentDto.Response create(StudentDto.Request request) {
        // Validate unique admission number
        if (studentRepository.existsByAdmissionNo(request.getAdmissionNo())) {
            throw new IllegalArgumentException("Admission number already exists: " + request.getAdmissionNo());
        }
        
        // Validate unique username
        if (studentRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + request.getUsername());
        }
        
        ManageSchool school = new ManageSchool();
        school.setId(request.getSchoolId());
        
        Student student = new Student();
        student.setSchool(school);
        student.setName(request.getName());
        student.setAdmissionNo(request.getAdmissionNo());
        student.setAdmissionDate(request.getAdmissionDate());
        student.setBirthDate(request.getBirthDate());
        student.setGender(request.getGender());
        student.setBloodGroup(request.getBloodGroup());
        student.setReligion(request.getReligion());
        student.setCaste(request.getCaste());
        student.setPhone(request.getPhone());
        student.setEmail(request.getEmail());
        student.setNationalId(request.getNationalId());
        student.setStudentType(request.getStudentType());
        student.setClassName(request.getClassName());
        student.setSection(request.getSection());
        student.setGroupName(request.getGroup());
        student.setRollNo(request.getRollNo());
        student.setRegistrationNo(request.getRegistrationNo());
        student.setDiscount(request.getDiscount());
        student.setSecondLanguage(request.getSecondLanguage());
        student.setIsGuardian(request.getIsGuardian());
        student.setRelationWithGuardian(request.getRelationWithGuardian());
        student.setFatherName(request.getFatherName());
        student.setFatherPhone(request.getFatherPhone());
        student.setFatherEducation(request.getFatherEducation());
        student.setFatherProfession(request.getFatherProfession());
        student.setFatherDesignation(request.getFatherDesignation());
        student.setMotherName(request.getMotherName());
        student.setMotherPhone(request.getMotherPhone());
        student.setMotherEducation(request.getMotherEducation());
        student.setMotherProfession(request.getMotherProfession());
        student.setMotherDesignation(request.getMotherDesignation());
        student.setPresentAddress(request.getPresentAddress());
        student.setPermanentAddress(request.getPermanentAddress());
        student.setSameAsGuardianAddress(request.getSameAsGuardianAddress());
        student.setPreviousSchoolName(request.getPreviousSchoolName());
        student.setPreviousClass(request.getPreviousClass());
        student.setUsername(request.getUsername());
        student.setPassword(passwordEncoder.encode(request.getPassword()));
        student.setHealthCondition(request.getHealthCondition());
        student.setOtherInfo(request.getOtherInfo());
        student.setDeleted(false);
        
        Student saved = studentRepository.save(student);
        return toResponse(saved);
    }

    @Transactional
    public StudentDto.Response update(Long id, StudentDto.Request request) {
        Student student = studentRepository.findById(id)
            .orElseThrow(() -> new StudentNotFoundException(id));
        
        // Check username uniqueness if changed
        if (!student.getUsername().equals(request.getUsername()) && 
            studentRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + request.getUsername());
        }
        
        ManageSchool school = new ManageSchool();
        school.setId(request.getSchoolId());
        
        student.setSchool(school);
        student.setName(request.getName());
        student.setAdmissionNo(request.getAdmissionNo());
        student.setAdmissionDate(request.getAdmissionDate());
        student.setBirthDate(request.getBirthDate());
        student.setGender(request.getGender());
        student.setBloodGroup(request.getBloodGroup());
        student.setReligion(request.getReligion());
        student.setCaste(request.getCaste());
        student.setPhone(request.getPhone());
        student.setEmail(request.getEmail());
        student.setNationalId(request.getNationalId());
        student.setStudentType(request.getStudentType());
        student.setClassName(request.getClassName());
        student.setSection(request.getSection());
        student.setGroupName(request.getGroup());
        student.setRollNo(request.getRollNo());
        student.setRegistrationNo(request.getRegistrationNo());
        student.setDiscount(request.getDiscount());
        student.setSecondLanguage(request.getSecondLanguage());
        student.setIsGuardian(request.getIsGuardian());
        student.setRelationWithGuardian(request.getRelationWithGuardian());
        student.setFatherName(request.getFatherName());
        student.setFatherPhone(request.getFatherPhone());
        student.setFatherEducation(request.getFatherEducation());
        student.setFatherProfession(request.getFatherProfession());
        student.setFatherDesignation(request.getFatherDesignation());
        student.setMotherName(request.getMotherName());
        student.setMotherPhone(request.getMotherPhone());
        student.setMotherEducation(request.getMotherEducation());
        student.setMotherProfession(request.getMotherProfession());
        student.setMotherDesignation(request.getMotherDesignation());
        student.setPresentAddress(request.getPresentAddress());
        student.setPermanentAddress(request.getPermanentAddress());
        student.setSameAsGuardianAddress(request.getSameAsGuardianAddress());
        student.setPreviousSchoolName(request.getPreviousSchoolName());
        student.setPreviousClass(request.getPreviousClass());
        student.setUsername(request.getUsername());
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            student.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        student.setHealthCondition(request.getHealthCondition());
        student.setOtherInfo(request.getOtherInfo());
        
        Student updated = studentRepository.save(student);
        return toResponse(updated);
    }

    @Transactional
    public void delete(Long id) {
        Student student = studentRepository.findById(id)
            .orElseThrow(() -> new StudentNotFoundException(id));
        student.setDeleted(true);
        studentRepository.save(student);
    }

    private StudentDto.Response toResponse(Student entity) {
        StudentDto.Response response = new StudentDto.Response();
        response.setId(entity.getId());
        response.setSchoolId(entity.getSchool() != null ? entity.getSchool().getId() : null);
        response.setSchoolName(entity.getSchool() != null ? entity.getSchool().getSchoolName() : null);
        response.setName(entity.getName());
        response.setAdmissionNo(entity.getAdmissionNo());
        response.setAdmissionDate(entity.getAdmissionDate());
        response.setBirthDate(entity.getBirthDate());
        response.setGender(entity.getGender());
        response.setBloodGroup(entity.getBloodGroup());
        response.setReligion(entity.getReligion());
        response.setCaste(entity.getCaste());
        response.setPhone(entity.getPhone());
        response.setEmail(entity.getEmail());
        response.setNationalId(entity.getNationalId());
        response.setStudentType(entity.getStudentType());
        response.setClassName(entity.getClassName());
        response.setSection(entity.getSection());
        response.setGroup(entity.getGroupName());
        response.setRollNo(entity.getRollNo());
        response.setRegistrationNo(entity.getRegistrationNo());
        response.setDiscount(entity.getDiscount());
        response.setSecondLanguage(entity.getSecondLanguage());
        response.setIsGuardian(entity.getIsGuardian());
        response.setRelationWithGuardian(entity.getRelationWithGuardian());
        response.setFatherName(entity.getFatherName());
        response.setFatherPhone(entity.getFatherPhone());
        response.setFatherEducation(entity.getFatherEducation());
        response.setFatherProfession(entity.getFatherProfession());
        response.setFatherDesignation(entity.getFatherDesignation());
        response.setFatherPhotoUrl(entity.getFatherPhotoUrl());
        response.setMotherName(entity.getMotherName());
        response.setMotherPhone(entity.getMotherPhone());
        response.setMotherEducation(entity.getMotherEducation());
        response.setMotherProfession(entity.getMotherProfession());
        response.setMotherDesignation(entity.getMotherDesignation());
        response.setMotherPhotoUrl(entity.getMotherPhotoUrl());
        response.setPresentAddress(entity.getPresentAddress());
        response.setPermanentAddress(entity.getPermanentAddress());
        response.setSameAsGuardianAddress(entity.getSameAsGuardianAddress());
        response.setPreviousSchoolName(entity.getPreviousSchoolName());
        response.setPreviousClass(entity.getPreviousClass());
        response.setTransferCertificateUrl(entity.getTransferCertificateUrl());
        response.setUsername(entity.getUsername());
        response.setHealthCondition(entity.getHealthCondition());
        response.setOtherInfo(entity.getOtherInfo());
        response.setPhotoUrl(entity.getPhotoUrl());
        return response;
    }
}