package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.LeaveTypeDto;
import com.School.School_management.Entity.Designation;
import com.School.School_management.Entity.LeaveType;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ConflictException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.DesignationRepository;
import com.School.School_management.Repository.LeaveTypeRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.LeaveTypeService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class LeaveTypeServiceImpl implements LeaveTypeService {

    private final LeaveTypeRepository leaveTypeRepository;
    private final SchoolRepository schoolRepository;
    private final DesignationRepository designationRepository;

    public LeaveTypeServiceImpl(
            LeaveTypeRepository leaveTypeRepository,
            SchoolRepository schoolRepository,
            DesignationRepository designationRepository
    ) {
        this.leaveTypeRepository = leaveTypeRepository;
        this.schoolRepository = schoolRepository;
        this.designationRepository = designationRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeaveTypeDto.Response> list(Long schoolId, String applicantType, Long designationId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        List<LeaveType> rows;
        if (user.isSuperAdmin() && schoolId == null) {
            rows = leaveTypeRepository.findAllByOrderByIdDesc();
        } else {
            Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
            rows = leaveTypeRepository.findBySchoolIdOrderByIdDesc(effectiveSchoolId);
        }

        String normalizedApplicantType = applicantType == null || applicantType.isBlank() ? null : normalizeRoleValue(applicantType);
        return rows.stream()
                .filter((row) -> normalizedApplicantType == null || normalizeRoleValue(row.getApplicantType()).equalsIgnoreCase(normalizedApplicantType))
                .filter((row) -> designationId == null || Objects.equals(row.getDesignationId(), designationId))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public LeaveTypeDto.Response create(LeaveTypeDto.Request request) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, request == null ? null : request.getSchoolId());
        String applicantType = normalizeRoleValue(request == null ? null : request.getApplicantType(), "Applicant type is required");
        String leaveType = normalizeRequired(request == null ? null : request.getLeaveType(), "Leave type is required");
        Integer allowedLeavesPerYear = normalizeAllowedLeaves(request == null ? null : request.getAllowedLeavesPerYear());
        Long designationId = resolveDesignationId(effectiveSchoolId, applicantType, request == null ? null : request.getDesignationId());

        if (leaveTypeRepository.existsBySchoolIdAndApplicantTypeIgnoreCaseAndDesignationIdAndLeaveTypeIgnoreCase(
                effectiveSchoolId, applicantType, designationId, leaveType)) {
            throw new ConflictException("Leave type already exists for this school");
        }

        LeaveType entity = new LeaveType();
        entity.setSchool(refSchool(effectiveSchoolId));
        entity.setDesignationId(designationId);
        entity.setApplicantType(applicantType);
        entity.setLeaveType(leaveType);
        entity.setAllowedLeavesPerYear(allowedLeavesPerYear);
        return toResponse(leaveTypeRepository.save(entity));
    }

    @Override
    public LeaveTypeDto.Response update(Long id, LeaveTypeDto.Request request) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        LeaveType entity = leaveTypeRepository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, request == null ? null : request.getSchoolId());
        if (!Objects.equals(entity.getSchool() != null ? entity.getSchool().getId() : null, effectiveSchoolId) && !user.isSuperAdmin()) {
            throw new ForbiddenException();
        }

        String applicantType = normalizeRoleValue(request == null ? null : request.getApplicantType(), "Applicant type is required");
        String leaveType = normalizeRequired(request == null ? null : request.getLeaveType(), "Leave type is required");
        Integer allowedLeavesPerYear = normalizeAllowedLeaves(request == null ? null : request.getAllowedLeavesPerYear());
        Long designationId = resolveDesignationId(effectiveSchoolId, applicantType, request == null ? null : request.getDesignationId());

        boolean duplicate = leaveTypeRepository.existsBySchoolIdAndApplicantTypeIgnoreCaseAndDesignationIdAndLeaveTypeIgnoreCaseAndIdNot(
                effectiveSchoolId, applicantType, designationId, leaveType, id);
        if (duplicate) {
            throw new ConflictException("Leave type already exists for this school");
        }

        entity.setSchool(refSchool(effectiveSchoolId));
        entity.setDesignationId(designationId);
        entity.setApplicantType(applicantType);
        entity.setLeaveType(leaveType);
        entity.setAllowedLeavesPerYear(allowedLeavesPerYear);
        return toResponse(leaveTypeRepository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        LeaveType entity = leaveTypeRepository.findById(id).orElseThrow(NotFoundException::new);
        Long entitySchoolId = entity.getSchool() != null ? entity.getSchool().getId() : null;
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, entitySchoolId);
        if (!Objects.equals(entitySchoolId, effectiveSchoolId) && !user.isSuperAdmin()) {
            throw new ForbiddenException();
        }
        leaveTypeRepository.delete(entity);
    }

    private Long effectiveSchoolIdForRead(CurrentUser user, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return user.schoolId();
        }

        if (user.isHeadOfficeScopedAdmin()) {
            if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
            ensureSchoolInHeadOffice(requestedSchoolId, user.headOfficeId());
            return requestedSchoolId;
        }

        if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
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

        if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
        return requestedSchoolId;
    }

    private void ensureSchoolInHeadOffice(Long schoolId, Long headOfficeId) {
        boolean ok = schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isPresent();
        if (!ok) throw new NotFoundException();
    }

    private ManageSchool refSchool(Long schoolId) {
        ManageSchool school = new ManageSchool();
        school.setId(schoolId);
        return school;
    }

    private Long resolveDesignationId(Long schoolId, String applicantType, Long requestedDesignationId) {
        if (isStudentApplicant(applicantType)) {
            return null;
        }

        if (requestedDesignationId == null) {
            throw new BadRequestException("Designation is required");
        }

        Designation designation = designationRepository.findById(requestedDesignationId)
                .orElseThrow(NotFoundException::new);
        if (!Objects.equals(designation.getSchoolId(), schoolId)) {
            throw new BadRequestException("Designation does not belong to the selected school");
        }
        String designationRole = normalizeRoleValue(designation.getRole(), "Designation role is required");
        if (!designationRole.equalsIgnoreCase(applicantType)) {
            throw new BadRequestException("Designation does not belong to the selected applicant type");
        }
        return designation.getId();
    }

    private boolean isStudentApplicant(String applicantType) {
        return applicantType != null && "STUDENT".equalsIgnoreCase(applicantType.trim());
    }

    private Integer normalizeAllowedLeaves(Integer value) {
        if (value == null) {
            throw new BadRequestException("Allowed leaves per year is required");
        }
        if (value < 0) {
            throw new BadRequestException("Allowed leaves per year must be zero or greater");
        }
        return value;
    }

    private String normalizeRequired(String value, String message) {
        if (value == null) throw new BadRequestException(message);
        String trimmed = value.trim();
        if (trimmed.isEmpty()) throw new BadRequestException(message);
        return trimmed;
    }

    private String normalizeRoleValue(String value, String message) {
        String normalized = normalizeRequired(value, message)
                .trim()
                .toUpperCase()
                .replace('-', '_')
                .replace(' ', '_');
        normalized = normalized.replaceAll("_+", "_");
        normalized = normalized.replaceAll("^_+|_+$", "");
        if (normalized.isBlank()) throw new BadRequestException(message);
        return normalized;
    }

    private String normalizeRoleValue(String value) {
        return normalizeRoleValue(value, "Role is required");
    }

    private LeaveTypeDto.Response toResponse(LeaveType entity) {
        LeaveTypeDto.Response dto = new LeaveTypeDto.Response();
        Long schoolId = entity.getSchool() != null ? entity.getSchool().getId() : null;
        dto.setId(entity.getId());
        dto.setSchoolId(schoolId);
        dto.setSchoolName(resolveSchoolName(schoolId));
        dto.setDesignationId(entity.getDesignationId());
        dto.setDesignationName(resolveDesignationName(entity.getDesignationId()));
        dto.setApplicantType(entity.getApplicantType());
        dto.setLeaveType(entity.getLeaveType());
        dto.setAllowedLeavesPerYear(entity.getAllowedLeavesPerYear());
        return dto;
    }

    private String resolveSchoolName(Long schoolId) {
        if (schoolId == null) return null;
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .map(ManageSchool::getSchoolName)
                .orElse(null);
    }

    private String resolveDesignationName(Long designationId) {
        if (designationId == null) return null;
        return designationRepository.findById(designationId)
                .map(Designation::getName)
                .orElse(null);
    }
}
