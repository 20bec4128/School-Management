// com/School/School_management/Service/StudentService.java
package com.School.School_management.Service;

import com.School.School_management.Dto.PaginationResponse;
import com.School.School_management.Dto.StudentDto;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.Parent;
import com.School.School_management.Entity.ParentStudent;
import com.School.School_management.Entity.ParentStudentKey;
import com.School.School_management.Entity.SchoolClass;
import com.School.School_management.Entity.SchoolSection;
import com.School.School_management.Entity.Student;
import com.School.School_management.Exception.StudentNotFoundException;
import com.School.School_management.Repository.ParentRepository;
import com.School.School_management.Repository.ParentStudentRepository;
import com.School.School_management.Repository.SchoolClassRepository;
import com.School.School_management.Repository.SchoolSectionRepository;
import com.School.School_management.Repository.StudentRepository;
import java.util.List;
import java.util.Optional;
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
    private final ParentRepository parentRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SchoolSectionRepository schoolSectionRepository;
    private final PasswordEncoder passwordEncoder;

    public StudentService(StudentRepository studentRepository,
                          ParentRepository parentRepository,
                          ParentStudentRepository parentStudentRepository,
                          SchoolClassRepository schoolClassRepository,
                          SchoolSectionRepository schoolSectionRepository,
                          PasswordEncoder passwordEncoder) {
        this.studentRepository = studentRepository;
        this.parentRepository = parentRepository;
        this.parentStudentRepository = parentStudentRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.schoolSectionRepository = schoolSectionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public PaginationResponse<StudentDto.Response> getAll(int page, int size,
                                                           Long headOfficeId,
                                                           Long schoolId,
                                                           Long classId,
                                                           Long sectionId,
                                                           String className, 
                                                           String section, 
                                                           String groupName,
                                                           String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedClassName = normalizeOptionalText(className);
        String normalizedSection = normalizeOptionalText(section);
        String normalizedGroup = normalizeOptionalText(groupName);
        String normalizedSearch = normalizeOptionalText(search);
        Page<Student> studentPage;
        
        if (headOfficeId != null || schoolId != null || classId != null || sectionId != null || normalizedClassName != null || normalizedSection != null || normalizedGroup != null || normalizedSearch != null) {
            studentPage = studentRepository.searchStudents(headOfficeId, schoolId, classId, sectionId, normalizedClassName, normalizedSection, normalizedGroup, normalizedSearch, pageable);
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
        if (studentRepository.existsByAdmissionNoAndDeletedFalse(request.getAdmissionNo())) {
            throw new IllegalArgumentException("Admission number already exists: " + request.getAdmissionNo());
        }
        
        // Validate unique username
        if (studentRepository.existsByUsernameAndDeletedFalse(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + request.getUsername());
        }
        
        ManageSchool school = new ManageSchool();
        school.setId(request.getSchoolId());
        SchoolClass schoolClass = resolveSchoolClass(request.getSchoolId(), request.getClassId());
        SchoolSection schoolSection = resolveSchoolSection(request.getSchoolId(), request.getClassId(), request.getSectionId());
        
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
        student.setSchoolClass(schoolClass);
        student.setClassName(resolveClassName(schoolClass, request.getClassName()));
        student.setSchoolSection(schoolSection);
        student.setSection(resolveSectionName(schoolSection, request.getSection()));
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
        student.setFatherEmail(request.getFatherEmail());
        student.setMotherName(request.getMotherName());
        student.setMotherPhone(request.getMotherPhone());
        student.setMotherEducation(request.getMotherEducation());
        student.setMotherProfession(request.getMotherProfession());
        student.setMotherDesignation(request.getMotherDesignation());
        student.setMotherEmail(request.getMotherEmail());
        student.setGuardianEmail(request.getGuardianEmail());
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
        syncParentLink(saved, request, true);
        return toResponse(saved);
    }

    @Transactional
    public StudentDto.Response update(Long id, StudentDto.Request request) {
        Student student = studentRepository.findById(id)
            .orElseThrow(() -> new StudentNotFoundException(id));
        
        // Check username uniqueness if changed
        if (!student.getUsername().equals(request.getUsername()) && 
            studentRepository.existsByUsernameAndDeletedFalse(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + request.getUsername());
        }
        
        ManageSchool school = new ManageSchool();
        school.setId(request.getSchoolId());
        SchoolClass schoolClass = resolveSchoolClass(request.getSchoolId(), request.getClassId());
        SchoolSection schoolSection = resolveSchoolSection(request.getSchoolId(), request.getClassId(), request.getSectionId());
        
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
        student.setSchoolClass(schoolClass);
        student.setClassName(resolveClassName(schoolClass, request.getClassName()));
        student.setSchoolSection(schoolSection);
        student.setSection(resolveSectionName(schoolSection, request.getSection()));
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
        student.setFatherEmail(request.getFatherEmail());
        student.setMotherName(request.getMotherName());
        student.setMotherPhone(request.getMotherPhone());
        student.setMotherEducation(request.getMotherEducation());
        student.setMotherProfession(request.getMotherProfession());
        student.setMotherDesignation(request.getMotherDesignation());
        student.setMotherEmail(request.getMotherEmail());
        student.setGuardianEmail(request.getGuardianEmail());
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
        syncParentLink(updated, request, false);
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
        response.setClassId(entity.getSchoolClass() != null ? entity.getSchoolClass().getId() : null);
        response.setSectionId(entity.getSchoolSection() != null ? entity.getSchoolSection().getId() : null);
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
        response.setFatherEmail(entity.getFatherEmail());
        response.setMotherName(entity.getMotherName());
        response.setMotherPhone(entity.getMotherPhone());
        response.setMotherEducation(entity.getMotherEducation());
        response.setMotherProfession(entity.getMotherProfession());
        response.setMotherDesignation(entity.getMotherDesignation());
        response.setMotherPhotoUrl(entity.getMotherPhotoUrl());
        response.setMotherEmail(entity.getMotherEmail());
        response.setGuardianEmail(entity.getGuardianEmail());
        response.setPresentAddress(entity.getPresentAddress());
        response.setPermanentAddress(entity.getPermanentAddress());
        response.setSameAsGuardianAddress(entity.getSameAsGuardianAddress());
        response.setPreviousSchoolName(entity.getPreviousSchoolName());
        response.setPreviousClass(entity.getPreviousClass());
        response.setTransferCertificateUrl(entity.getTransferCertificateUrl());
        response.setUsername(entity.getUsername());
        response.setParentUsername(resolveParentUsername(entity.getId()));
        response.setHealthCondition(entity.getHealthCondition());
        response.setOtherInfo(entity.getOtherInfo());
        response.setPhotoUrl(entity.getPhotoUrl());
        return response;
    }

    private SchoolClass resolveSchoolClass(Long schoolId, Long classId) {
        if (classId == null) {
            throw new IllegalArgumentException("Class is required");
        }

        SchoolClass schoolClass = schoolClassRepository.findById(classId)
            .orElseThrow(() -> new IllegalArgumentException("Class not found: " + classId));
        if (schoolId != null && schoolClass.getSchool() != null && !schoolId.equals(schoolClass.getSchool().getId())) {
            throw new IllegalArgumentException("Class does not belong to the selected school");
        }
        return schoolClass;
    }

    private SchoolSection resolveSchoolSection(Long schoolId, Long classId, Long sectionId) {
        if (sectionId == null) {
            throw new IllegalArgumentException("Section is required");
        }

        SchoolSection schoolSection = schoolSectionRepository.findById(sectionId)
            .orElseThrow(() -> new IllegalArgumentException("Section not found: " + sectionId));
        if (schoolId != null && schoolSection.getSchool() != null && !schoolId.equals(schoolSection.getSchool().getId())) {
            throw new IllegalArgumentException("Section does not belong to the selected school");
        }
        if (classId != null && schoolSection.getSchoolClass() != null && !classId.equals(schoolSection.getSchoolClass().getId())) {
            throw new IllegalArgumentException("Section does not belong to the selected class");
        }
        return schoolSection;
    }

    private String resolveClassName(SchoolClass schoolClass, String fallback) {
        if (schoolClass == null) {
            return fallback;
        }
        if (schoolClass.getClassName() != null && !schoolClass.getClassName().isBlank()) {
            return schoolClass.getClassName();
        }
        return schoolClass.getNumericName() != null && !schoolClass.getNumericName().isBlank()
            ? schoolClass.getNumericName()
            : fallback;
    }

    private String resolveSectionName(SchoolSection schoolSection, String fallback) {
        if (schoolSection == null) {
            return fallback;
        }
        return schoolSection.getName() != null && !schoolSection.getName().isBlank()
            ? schoolSection.getName()
            : fallback;
    }

    private void syncParentLink(Student student, StudentDto.Request request, boolean isCreate) {
        String parentUsername = normalize(request.getParentUsername());
        String parentPassword = normalize(request.getParentPassword());

        if (!isCreate && parentUsername == null && parentPassword == null) {
            return;
        }
        if (parentUsername == null) {
            throw new IllegalArgumentException("Parent mobile is required");
        }

        String normalizedParentUsername = normalizePhoneUsername(parentUsername);
        Parent parent = findParentByFlexibleUsername(normalizedParentUsername).orElse(null);
        if (parent == null) {
            if (parentPassword == null) {
                throw new IllegalArgumentException("Parent password is required");
            }
            parent = new Parent();
            parent.setSchoolId(student.getSchool() != null ? student.getSchool().getId() : request.getSchoolId());
            parent.setUsername(normalizedParentUsername);
            parent.setPhone(normalizedParentUsername);
            parent.setName(resolveParentName(request));
            parent.setPasswordHash(passwordEncoder.encode(parentPassword));
            parent.setActive(Boolean.TRUE);
            parent = parentRepository.save(parent);
        } else {
            if (parentPassword != null) {
                parent.setPasswordHash(passwordEncoder.encode(parentPassword));
            }
            parent.setUsername(normalizedParentUsername);
            parent.setPhone(normalizedParentUsername);
            if (parent.getSchoolId() == null && student.getSchool() != null) {
                parent.setSchoolId(student.getSchool().getId());
            }
            parent = parentRepository.save(parent);
        }

        if (!isCreate) {
            parentStudentRepository.deleteByStudentId(student.getId());
        }
        parentStudentRepository.save(new ParentStudent(new ParentStudentKey(parent.getId(), student.getId())));
    }

    private String resolveParentName(StudentDto.Request request) {
        if (request == null) return null;
        if (request.getFatherName() != null && !request.getFatherName().isBlank()) return request.getFatherName();
        if (request.getMotherName() != null && !request.getMotherName().isBlank()) return request.getMotherName();
        if (request.getName() != null && !request.getName().isBlank()) return request.getName() + " Parent";
        return null;
    }

    private String resolveParentUsername(Long studentId) {
        if (studentId == null) return null;
        List<Long> parentIds = parentStudentRepository.findParentIdsByStudentId(studentId);
        if (parentIds == null || parentIds.isEmpty()) return null;
        return parentRepository.findById(parentIds.get(0))
                .map(Parent::getUsername)
                .orElse(null);
    }

    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeOptionalText(String value) {
        String normalized = normalize(value);
        if (normalized == null) return null;
        if ("Select".equalsIgnoreCase(normalized) || "All".equalsIgnoreCase(normalized)) {
            return null;
        }
        return normalized;
    }

    private String normalizePhoneUsername(String value) {
        String trimmed = normalize(value);
        if (trimmed == null) return null;
        String compact = trimmed.replaceAll("[\\s\\-()]+", "");
        if (compact.startsWith("+")) return compact;
        String digits = compact.replaceAll("\\D", "");
        if (digits.length() == 10) return "+91" + digits;
        return digits.isEmpty() ? null : digits;
    }

    private Optional<Parent> findParentByFlexibleUsername(String username) {
        String normalized = normalizePhoneUsername(username);
        if (normalized == null) return Optional.empty();
        return parentRepository.findAll().stream()
                .filter(parent -> Boolean.TRUE.equals(parent.getActive()))
                .filter(parent -> normalized.equals(normalizePhoneUsername(parent.getUsername())))
                .findFirst();
    }
}
