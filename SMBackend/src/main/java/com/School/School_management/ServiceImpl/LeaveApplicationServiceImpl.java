package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.LeaveApplicationDto;
import com.School.School_management.Entity.Designation;
import com.School.School_management.Entity.Employee;
import com.School.School_management.Entity.HeadOffice;
import com.School.School_management.Entity.LeaveApplication;
import com.School.School_management.Entity.LeaveType;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.Student;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ConflictException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.DesignationRepository;
import com.School.School_management.Repository.EmployeeRepository;
import com.School.School_management.Repository.HeadOfficeRepository;
import com.School.School_management.Repository.LeaveApplicationRepository;
import com.School.School_management.Repository.LeaveTypeRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.StudentRepository;
import com.School.School_management.Service.LeaveApplicationService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.config.UploadProperties;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
public class LeaveApplicationServiceImpl implements LeaveApplicationService {

    private static final Set<String> ALLOWED_STATUS = Set.of("PENDING", "APPROVED", "DECLINED");
    private static final Set<String> ALLOWED_APPLICANT_TYPES = Set.of("STUDENT", "TEACHER", "EMPLOYEE");

    private final LeaveApplicationRepository leaveApplicationRepository;
    private final SchoolRepository schoolRepository;
    private final HeadOfficeRepository headOfficeRepository;
    private final EmployeeRepository employeeRepository;
    private final StudentRepository studentRepository;
    private final DesignationRepository designationRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final Path uploadDir;

    public LeaveApplicationServiceImpl(
            LeaveApplicationRepository leaveApplicationRepository,
            SchoolRepository schoolRepository,
            HeadOfficeRepository headOfficeRepository,
            EmployeeRepository employeeRepository,
            StudentRepository studentRepository,
            DesignationRepository designationRepository,
            LeaveTypeRepository leaveTypeRepository,
            UploadProperties uploadProperties
    ) {
        this.leaveApplicationRepository = leaveApplicationRepository;
        this.schoolRepository = schoolRepository;
        this.headOfficeRepository = headOfficeRepository;
        this.employeeRepository = employeeRepository;
        this.studentRepository = studentRepository;
        this.designationRepository = designationRepository;
        this.leaveTypeRepository = leaveTypeRepository;
        this.uploadDir = Paths.get(uploadProperties.getDir(), "leave-applications").toAbsolutePath().normalize();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeaveApplicationDto.Response> list(Long schoolId, String status) {
        CurrentUser user = requireUser();
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
        String normalizedStatus = normalizeStatus(status);

        List<LeaveApplication> rows;
        if (user.isSuperAdmin() && effectiveSchoolId == null) {
            rows = normalizedStatus == null
                    ? leaveApplicationRepository.findAllByOrderByIdDesc()
                    : leaveApplicationRepository.findByStatusIgnoreCaseOrderByIdDesc(normalizedStatus);
        } else if (effectiveSchoolId == null) {
            rows = List.of();
        } else if (normalizedStatus == null) {
            rows = leaveApplicationRepository.findBySchool_IdOrderByIdDesc(effectiveSchoolId);
        } else {
            rows = leaveApplicationRepository.findBySchool_IdAndStatusIgnoreCaseOrderByIdDesc(effectiveSchoolId, normalizedStatus);
        }
        return rows.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeaveApplicationDto.Response> coverage(Long schoolId, String applicantType, LocalDate date, List<Long> applicantIds) {
        CurrentUser user = requireUser();
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
        if (effectiveSchoolId == null) return List.of();
        if (date == null) throw new BadRequestException("date is required");

        String normalizedType = String.valueOf(applicantType == null ? "" : applicantType).trim().toUpperCase(Locale.ROOT);
        if (normalizedType.isBlank()) throw new BadRequestException("applicantType is required");
        if (!ALLOWED_APPLICANT_TYPES.contains(normalizedType)) {
            throw new BadRequestException("Unsupported applicantType: " + applicantType);
        }

        if (applicantIds == null || applicantIds.isEmpty()) return List.of();
        // Guard against accidental huge IN lists.
        if (applicantIds.size() > 2000) throw new BadRequestException("Too many applicantIds");

        return leaveApplicationRepository
                .findApprovedCoverage(effectiveSchoolId, normalizedType, date, applicantIds)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public LeaveApplicationDto.Response create(LeaveApplicationDto.Request request, MultipartFile attachment) {
        CurrentUser user = requireUser();
        LeaveApplication entity = new LeaveApplication();
        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, request == null ? null : request.getSchoolId());
        populateEntity(entity, request, effectiveSchoolId, null);
        applyAttachment(entity, attachment);
        return toResponse(leaveApplicationRepository.save(entity));
    }

    @Override
    public LeaveApplicationDto.Response update(Long id, LeaveApplicationDto.Request request, MultipartFile attachment) {
        CurrentUser user = requireUser();
        LeaveApplication existing = leaveApplicationRepository.findById(id).orElseThrow(NotFoundException::new);
        Long existingSchoolId = existing.getSchool() != null ? existing.getSchool().getId() : null;
        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, request == null ? existingSchoolId : request.getSchoolId());
        if (!Objects.equals(existingSchoolId, effectiveSchoolId) && !user.isSuperAdmin()) {
            throw new ForbiddenException();
        }

        populateEntity(existing, request, effectiveSchoolId, existing.getStatus());
        applyAttachment(existing, attachment);
        return toResponse(leaveApplicationRepository.save(existing));
    }

    @Override
    public LeaveApplicationDto.Response updateStatus(Long id, String status) {
        requireUser();
        LeaveApplication existing = leaveApplicationRepository.findById(id).orElseThrow(NotFoundException::new);
        existing.setStatus(normalizeStatusOrThrow(status));
        return toResponse(leaveApplicationRepository.save(existing));
    }

    @Override
    @Transactional(readOnly = true)
    public LeaveApplicationDto.Response getById(Long id) {
        requireUser();
        return toResponse(leaveApplicationRepository.findById(id).orElseThrow(NotFoundException::new));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = requireUser();
        LeaveApplication existing = leaveApplicationRepository.findById(id).orElseThrow(NotFoundException::new);
        Long schoolId = existing.getSchool() != null ? existing.getSchool().getId() : null;
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
        if (effectiveSchoolId != null && !Objects.equals(schoolId, effectiveSchoolId) && !user.isSuperAdmin()) {
            throw new ForbiddenException();
        }
        leaveApplicationRepository.delete(existing);
    }

    private void populateEntity(LeaveApplication entity, LeaveApplicationDto.Request request, Long schoolId, String preserveStatus) {
        if (request == null) throw new BadRequestException("Request body is required");

        String applicantType = normalizeRoleValue(request.getApplicantType(), "Applicant type is required");
        boolean studentApplicant = isStudentApplicant(applicantType);
        Long designationId = studentApplicant ? null : normalizeLong(request.getDesignationId(), "Designation is required");
        Long applicantId = normalizeLong(request.getApplicantId(), "Applicant is required");
        Long leaveTypeId = normalizeLong(request.getLeaveTypeId(), "Leave type is required");
        LocalDate applicationDate = request.getApplicationDate() != null ? request.getApplicationDate() : LocalDate.now();
        LocalDate leaveFrom = normalizeDate(request.getLeaveFrom(), "Leave from is required");
        LocalDate leaveTo = normalizeDate(request.getLeaveTo(), "Leave to is required");
        String leaveReason = normalizeText(request.getLeaveReason(), "Leave reason is required");

        if (leaveTo.isBefore(leaveFrom)) {
            throw new BadRequestException("Leave to date must be on or after leave from date");
        }

        ManageSchool school = schoolRepository.findByIdAndIsDeletedFalse(schoolId).orElseThrow(NotFoundException::new);
        Long headOfficeId = school.getHeadOfficeId();
        String academicYear = resolveAcademicYear(applicationDate);

        entity.setSchool(school);
        entity.setHeadOfficeId(headOfficeId);
        entity.setAcademicYear(academicYear);
        entity.setApplicantType(applicantType);
        entity.setDesignationId(designationId);
        entity.setDesignationName(resolveDesignationName(designationId));
        entity.setApplicantId(applicantId);
        entity.setApplicantName(resolveApplicantName(applicantType, applicantId, schoolId));
        entity.setLeaveTypeId(leaveTypeId);
        entity.setLeaveTypeName(resolveLeaveTypeName(schoolId, leaveTypeId, applicantType, designationId));
        entity.setApplicationDate(applicationDate);
        entity.setLeaveFrom(leaveFrom);
        entity.setLeaveTo(leaveTo);
        entity.setLeaveReason(leaveReason);

        LeaveType leaveType = leaveTypeRepository.findById(leaveTypeId).orElseThrow(NotFoundException::new);
        Long leaveTypeSchoolId = leaveType.getSchool() != null ? leaveType.getSchool().getId() : null;
        if (!Objects.equals(leaveTypeSchoolId, schoolId)) {
            throw new BadRequestException("Leave type does not belong to the selected school");
        }
        String leaveTypeApplicantType = normalizeRoleValue(leaveType.getApplicantType(), "Leave type applicant type is required");
        if (!leaveTypeApplicantType.equalsIgnoreCase(applicantType)) {
            throw new BadRequestException("Leave type does not belong to the selected applicant type");
        }
        if (studentApplicant) {
            if (leaveType.getDesignationId() != null) {
                throw new BadRequestException("Leave type is not available for the selected applicant type");
            }
        } else if (!Objects.equals(leaveType.getDesignationId(), designationId)) {
            throw new BadRequestException("Leave type is not available for the selected designation");
        }

        String nextStatus = preserveStatus != null ? preserveStatus : normalizeStatusOrDefault(request.getStatus(), "PENDING");
        entity.setStatus(nextStatus);
    }

    private void applyAttachment(LeaveApplication entity, MultipartFile attachment) {
        if (attachment == null || attachment.isEmpty()) return;
        try {
            Files.createDirectories(uploadDir);
            String originalName = attachment.getOriginalFilename() == null ? "attachment" : attachment.getOriginalFilename();
            String sanitizedName = Paths.get(originalName).getFileName().toString().replaceAll("[^a-zA-Z0-9._-]", "_");
            String fileName = UUID.randomUUID() + "_" + sanitizedName;
            Path targetPath = uploadDir.resolve(fileName).normalize();
            attachment.transferTo(targetPath.toFile());
            entity.setAttachmentName(originalName);
            entity.setAttachmentUrl("/uploads/leave-applications/" + fileName);
            entity.setAttachmentType(attachment.getContentType());
        } catch (IOException ex) {
            throw new RuntimeException("File upload failed: " + ex.getMessage(), ex);
        }
    }

    private LeaveApplicationDto.Response toResponse(LeaveApplication entity) {
        LeaveApplicationDto.Response dto = new LeaveApplicationDto.Response();
        Long schoolId = entity.getSchool() != null ? entity.getSchool().getId() : null;
        dto.setId(entity.getId());
        dto.setSchoolId(schoolId);
        dto.setSchoolName(resolveSchoolName(schoolId));
        dto.setHeadOfficeId(entity.getHeadOfficeId());
        dto.setHeadOfficeName(resolveHeadOfficeName(entity.getHeadOfficeId()));
        dto.setAcademicYear(entity.getAcademicYear());
        dto.setApplicantType(entity.getApplicantType());
        dto.setDesignationId(entity.getDesignationId());
        dto.setDesignationName(entity.getDesignationName());
        dto.setApplicantId(entity.getApplicantId());
        dto.setApplicantName(entity.getApplicantName());
        dto.setLeaveTypeId(entity.getLeaveTypeId());
        dto.setLeaveTypeName(entity.getLeaveTypeName());
        dto.setApplicationDate(entity.getApplicationDate());
        dto.setLeaveFrom(entity.getLeaveFrom());
        dto.setLeaveTo(entity.getLeaveTo());
        dto.setLeaveReason(entity.getLeaveReason());
        dto.setStatus(entity.getStatus());
        dto.setAttachmentName(entity.getAttachmentName());
        dto.setAttachmentUrl(entity.getAttachmentUrl());
        dto.setAttachmentType(entity.getAttachmentType());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    private CurrentUser requireUser() {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        return user;
    }

    private Long effectiveSchoolIdForRead(CurrentUser user, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return user.schoolId();
        }

        if (user.isHeadOfficeScopedAdmin()) {
            if (requestedSchoolId == null) return null;
            ensureSchoolInHeadOffice(requestedSchoolId, user.headOfficeId());
            return requestedSchoolId;
        }

        if (user.isSuperAdmin()) {
            return requestedSchoolId;
        }

        if (requestedSchoolId == null) return user.schoolId();
        return requestedSchoolId;
    }

    private Long effectiveSchoolIdForWrite(CurrentUser user, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return user.schoolId();
        }

        if (user.isHeadOfficeScopedAdmin()) {
            if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
            ensureSchoolInHeadOffice(requestedSchoolId, user.headOfficeId());
            return requestedSchoolId;
        }

        if (user.isSuperAdmin()) {
            if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
            return requestedSchoolId;
        }

        if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
        return requestedSchoolId;
    }

    private void ensureSchoolInHeadOffice(Long schoolId, Long headOfficeId) {
        boolean ok = schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isPresent();
        if (!ok) throw new NotFoundException();
    }

    private String resolveSchoolName(Long schoolId) {
        if (schoolId == null) return null;
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId).map(ManageSchool::getSchoolName).orElse(null);
    }

    private String resolveHeadOfficeName(Long headOfficeId) {
        if (headOfficeId == null) return null;
        return headOfficeRepository.findById(headOfficeId).map(HeadOffice::getName).orElse(null);
    }

    private String resolveDesignationName(Long designationId) {
        if (designationId == null) return null;
        return designationRepository.findById(designationId).map(Designation::getName).orElse(null);
    }

    private String resolveApplicantName(String applicantType, Long applicantId, Long schoolId) {
        if (isStudentApplicant(applicantType)) {
            Student student = studentRepository.findById(applicantId).orElseThrow(NotFoundException::new);
            Long studentSchoolId = student.getSchool() != null ? student.getSchool().getId() : null;
            if (!Objects.equals(studentSchoolId, schoolId)) {
                throw new BadRequestException("Student does not belong to the selected school");
            }
            return student.getName();
        }

        Employee employee = employeeRepository.findById(applicantId).orElseThrow(NotFoundException::new);
        Long employeeSchoolId = employee.getSchoolId();
        if (!Objects.equals(employeeSchoolId, schoolId)) {
            throw new BadRequestException("Employee does not belong to the selected school");
        }
        if (!normalizeRoleValue(employee.getRole(), "Employee role is required").equalsIgnoreCase(applicantType)) {
            throw new BadRequestException("Employee role does not match the selected applicant type");
        }
        return employee.getName();
    }

    private String resolveLeaveTypeName(Long schoolId, Long leaveTypeId, String applicantType, Long designationId) {
        LeaveType leaveType = leaveTypeRepository.findById(leaveTypeId).orElseThrow(NotFoundException::new);
        Long leaveTypeSchoolId = leaveType.getSchool() != null ? leaveType.getSchool().getId() : null;
        if (!Objects.equals(leaveTypeSchoolId, schoolId)) {
            throw new BadRequestException("Leave type does not belong to the selected school");
        }
        String leaveTypeApplicantType = normalizeRoleValue(leaveType.getApplicantType(), "Leave type applicant type is required");
        if (!leaveTypeApplicantType.equalsIgnoreCase(applicantType)) {
            throw new BadRequestException("Leave type does not belong to the selected applicant type");
        }
        if (isStudentApplicant(applicantType)) {
            if (leaveType.getDesignationId() != null) {
                throw new BadRequestException("Leave type is not available for the selected applicant type");
            }
        } else if (!Objects.equals(leaveType.getDesignationId(), designationId)) {
            throw new BadRequestException("Leave type is not available for the selected designation");
        }
        return leaveType.getLeaveType();
    }

    private String resolveAcademicYear(LocalDate date) {
        LocalDate d = date == null ? LocalDate.now() : date;
        int year = d.getYear();
        if (d.getMonthValue() >= 4) {
            return year + "-" + (year + 1);
        }
        return (year - 1) + "-" + year;
    }

    private Long normalizeLong(Long value, String message) {
        if (value == null) throw new BadRequestException(message);
        return value;
    }

    private LocalDate normalizeDate(LocalDate value, String message) {
        if (value == null) throw new BadRequestException(message);
        return value;
    }

    private String normalizeText(String value, String message) {
        if (value == null) throw new BadRequestException(message);
        String trimmed = value.trim();
        if (trimmed.isEmpty()) throw new BadRequestException(message);
        return trimmed;
    }

    private String normalizeStatus(String value) {
        if (value == null || value.isBlank() || "ALL".equalsIgnoreCase(value.trim())) return null;
        return normalizeStatusOrThrow(value);
    }

    private String normalizeStatusOrThrow(String value) {
        String normalized = normalizeRoleValue(value, "Status is required");
        if ("REJECTED".equals(normalized) || "DECLINE".equals(normalized)) return "DECLINED";
        if ("WAITING".equals(normalized)) return "PENDING";
        if (!ALLOWED_STATUS.contains(normalized)) {
            throw new BadRequestException("Invalid status");
        }
        return normalized;
    }

    private String normalizeStatusOrDefault(String value, String defaultValue) {
        if (value == null || value.isBlank()) return defaultValue;
        return normalizeStatusOrThrow(value);
    }

    private String normalizeRoleValue(String value, String message) {
        if (value == null) throw new BadRequestException(message);
        String normalized = value.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
        normalized = normalized.replaceAll("_+", "_").replaceAll("^_+|_+$", "");
        if (normalized.isBlank()) throw new BadRequestException(message);
        return normalized;
    }

    private boolean isStudentApplicant(String applicantType) {
        return applicantType != null && "STUDENT".equalsIgnoreCase(applicantType.trim());
    }
}
