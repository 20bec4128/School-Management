package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.CertificateTypeDto;
import com.School.School_management.Entity.CertificateType;
import com.School.School_management.Entity.HeadOffice;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ConflictException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.CertificateTypeRepository;
import com.School.School_management.Repository.HeadOfficeRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.CertificateTypeService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.util.Objects;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CertificateTypeServiceImpl implements CertificateTypeService {

    private final CertificateTypeRepository certificateTypeRepository;
    private final SchoolRepository schoolRepository;
    private final HeadOfficeRepository headOfficeRepository;

    public CertificateTypeServiceImpl(
            CertificateTypeRepository certificateTypeRepository,
            SchoolRepository schoolRepository,
            HeadOfficeRepository headOfficeRepository
    ) {
        this.certificateTypeRepository = certificateTypeRepository;
        this.schoolRepository = schoolRepository;
        this.headOfficeRepository = headOfficeRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CertificateTypeDto> list(Long headOfficeId, Long schoolId, String search, int page, int size, CurrentUser user) {
        ResolvedScope scope = resolveListScope(user, headOfficeId, schoolId);
        String normalizedSearch = normalizeSearch(search);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id"));
        return certificateTypeRepository.searchCertificateTypes(scope.headOfficeId(), scope.schoolId(), normalizedSearch, pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public CertificateTypeDto getById(Long id, CurrentUser user) {
        CertificateType certificateType = certificateTypeRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        ensureVisibleToUser(certificateType, user);
        return toDto(certificateType);
    }

    @Override
    public CertificateTypeDto create(CertificateTypeDto dto, CurrentUser user) {
        ResolvedScope scope = resolveWriteScope(user, dto);
        String certificateName = normalizeRequired(dto == null ? null : dto.getCertificateName(), "Certificate name is required");
        if (certificateTypeRepository.existsBySchoolIdAndCertificateNameIgnoreCase(scope.schoolId(), certificateName)) {
            throw new ConflictException("A certificate type with this name already exists for this school");
        }

        CertificateType certificateType = new CertificateType();
        certificateType.setHeadOfficeId(scope.headOfficeId());
        certificateType.setSchoolId(scope.schoolId());
        applyDto(dto, certificateType);
        return toDto(certificateTypeRepository.save(certificateType));
    }

    @Override
    public CertificateTypeDto update(Long id, CertificateTypeDto dto, CurrentUser user) {
        CertificateType certificateType = certificateTypeRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        ensureVisibleToUser(certificateType, user);
        ResolvedScope scope = resolveWriteScope(user, dto);
        String certificateName = normalizeRequired(dto == null ? null : dto.getCertificateName(), "Certificate name is required");
        if (certificateTypeRepository.existsBySchoolIdAndCertificateNameIgnoreCaseAndIdNot(scope.schoolId(), certificateName, id)) {
            throw new ConflictException("A certificate type with this name already exists for this school");
        }

        certificateType.setHeadOfficeId(scope.headOfficeId());
        certificateType.setSchoolId(scope.schoolId());
        applyDto(dto, certificateType);
        return toDto(certificateTypeRepository.save(certificateType));
    }

    @Override
    public void delete(Long id, CurrentUser user) {
        CertificateType certificateType = certificateTypeRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        ensureVisibleToUser(certificateType, user);
        certificateTypeRepository.delete(certificateType);
    }

    private void ensureVisibleToUser(CertificateType certificateType, CurrentUser user) {
        if (user == null) {
            throw new ForbiddenException();
        }
        if (user.isSuperAdmin()) {
            return;
        }
        if (user.isHeadOfficeScopedAdmin()) {
            if (!Objects.equals(user.headOfficeId(), certificateType.getHeadOfficeId())) {
                throw new NotFoundException();
            }
            return;
        }
        if (user.isSchoolScopedAdminUser()) {
            if (!Objects.equals(user.schoolId(), certificateType.getSchoolId())) {
                throw new NotFoundException();
            }
            return;
        }
        throw new ForbiddenException();
    }

    private ResolvedScope resolveListScope(CurrentUser user, Long requestedHeadOfficeId, Long requestedSchoolId) {
        if (user == null) {
            throw new ForbiddenException();
        }

        if (user.isSuperAdmin()) {
            if (requestedSchoolId != null) {
                ManageSchool school = requireSchool(requestedSchoolId);
                if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
                    throw new BadRequestException("School does not belong to the selected head office");
                }
                return new ResolvedScope(school.getHeadOfficeId(), school.getId());
            }
            return new ResolvedScope(normalizeId(requestedHeadOfficeId), null);
        }

        if (user.isHeadOfficeScopedAdmin()) {
            Long authHeadOfficeId = user.headOfficeId();
            if (requestedHeadOfficeId != null && !Objects.equals(authHeadOfficeId, requestedHeadOfficeId)) {
                throw new ForbiddenException();
            }
            if (requestedSchoolId != null) {
                ManageSchool school = requireSchool(requestedSchoolId);
                if (!Objects.equals(authHeadOfficeId, school.getHeadOfficeId())) {
                    throw new BadRequestException("School does not belong to your head office");
                }
                return new ResolvedScope(authHeadOfficeId, school.getId());
            }
            return new ResolvedScope(authHeadOfficeId, null);
        }

        if (user.isSchoolScopedAdminUser()) {
            ManageSchool school = requireSchool(user.schoolId());
            if (requestedSchoolId != null && !Objects.equals(user.schoolId(), requestedSchoolId)) {
                throw new ForbiddenException();
            }
            if (requestedHeadOfficeId != null && !Objects.equals(school.getHeadOfficeId(), requestedHeadOfficeId)) {
                throw new ForbiddenException();
            }
            return new ResolvedScope(school.getHeadOfficeId(), school.getId());
        }

        throw new ForbiddenException();
    }

    private ResolvedScope resolveWriteScope(CurrentUser user, CertificateTypeDto dto) {
        if (user == null) {
            throw new ForbiddenException();
        }

        Long requestedHeadOfficeId = normalizeId(dto == null ? null : dto.getHeadOfficeId());
        Long requestedSchoolId = normalizeId(dto == null ? null : dto.getSchoolId());

        if (user.isSuperAdmin()) {
            ManageSchool school = requireSchool(requiredId(requestedSchoolId, "School is required"));
            if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
                throw new BadRequestException("School does not belong to the selected head office");
            }
            return new ResolvedScope(school.getHeadOfficeId(), school.getId());
        }

        if (user.isHeadOfficeScopedAdmin()) {
            Long authHeadOfficeId = user.headOfficeId();
            ManageSchool school = requireSchool(requiredId(requestedSchoolId, "School is required"));
            if (!Objects.equals(authHeadOfficeId, school.getHeadOfficeId())) {
                throw new BadRequestException("School does not belong to your head office");
            }
            if (requestedHeadOfficeId != null && !Objects.equals(authHeadOfficeId, requestedHeadOfficeId)) {
                throw new ForbiddenException();
            }
            return new ResolvedScope(authHeadOfficeId, school.getId());
        }

        if (user.isSchoolScopedAdminUser()) {
            ManageSchool school = requireSchool(user.schoolId());
            if (requestedSchoolId != null && !Objects.equals(requestedSchoolId, user.schoolId())) {
                throw new ForbiddenException();
            }
            if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
                throw new ForbiddenException();
            }
            return new ResolvedScope(school.getHeadOfficeId(), school.getId());
        }

        throw new ForbiddenException();
    }

    private ManageSchool requireSchool(Long schoolId) {
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .orElseThrow(NotFoundException::new);
    }

    private Long requiredId(Long value, String message) {
        if (value == null) {
            throw new BadRequestException(message);
        }
        return value;
    }

    private Long normalizeId(Long value) {
        return value == null || value <= 0 ? null : value;
    }

    private String normalizeSearch(String search) {
        String value = search == null ? "" : search.trim();
        return value.isEmpty() ? null : value;
    }

    private String normalizeRequired(String value, String message) {
        if (value == null) {
            throw new BadRequestException(message);
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            throw new BadRequestException(message);
        }
        return trimmed;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void applyDto(CertificateTypeDto dto, CertificateType certificateType) {
        certificateType.setCertificateName(normalizeRequired(dto == null ? null : dto.getCertificateName(), "Certificate name is required"));
        certificateType.setSchoolNameOnCard(normalizeOptional(dto == null ? null : dto.getSchoolNameOnCard()));
        certificateType.setCertificateText(normalizeOptional(dto == null ? null : dto.getCertificateText()));
        certificateType.setFooterLeftText(normalizeOptional(dto == null ? null : dto.getFooterLeftText()));
        certificateType.setFooterMiddleText(normalizeOptional(dto == null ? null : dto.getFooterMiddleText()));
        certificateType.setFooterRightText(normalizeOptional(dto == null ? null : dto.getFooterRightText()));
        certificateType.setBackgroundUrl(normalizeOptional(dto == null ? null : dto.getBackgroundUrl()));
    }

    private CertificateTypeDto toDto(CertificateType certificateType) {
        CertificateTypeDto dto = new CertificateTypeDto();
        dto.setId(certificateType.getId());
        dto.setHeadOfficeId(certificateType.getHeadOfficeId());
        dto.setHeadOfficeName(resolveHeadOfficeName(certificateType.getHeadOfficeId()));
        dto.setSchoolId(certificateType.getSchoolId());
        dto.setSchoolName(resolveSchoolName(certificateType.getSchoolId()));
        dto.setCertificateName(certificateType.getCertificateName());
        dto.setSchoolNameOnCard(certificateType.getSchoolNameOnCard());
        dto.setCertificateText(certificateType.getCertificateText());
        dto.setFooterLeftText(certificateType.getFooterLeftText());
        dto.setFooterMiddleText(certificateType.getFooterMiddleText());
        dto.setFooterRightText(certificateType.getFooterRightText());
        dto.setBackgroundUrl(certificateType.getBackgroundUrl());
        dto.setCreatedAt(certificateType.getCreatedAt());
        dto.setUpdatedAt(certificateType.getUpdatedAt());
        return dto;
    }

    private String resolveHeadOfficeName(Long headOfficeId) {
        if (headOfficeId == null) {
            return null;
        }
        return headOfficeRepository.findById(headOfficeId)
                .map(HeadOffice::getName)
                .orElse("Head Office " + headOfficeId);
    }

    private String resolveSchoolName(Long schoolId) {
        if (schoolId == null) {
            return null;
        }
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .map(ManageSchool::getSchoolName)
                .orElse("School " + schoolId);
    }

    private record ResolvedScope(Long headOfficeId, Long schoolId) {
    }
}
