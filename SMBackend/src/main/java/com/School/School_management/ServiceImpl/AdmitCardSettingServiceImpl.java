package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.AdmitCardSettingDto;
import com.School.School_management.Entity.AdmitCardSetting;
import com.School.School_management.Entity.HeadOffice;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.AdmitCardSettingRepository;
import com.School.School_management.Repository.HeadOfficeRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.AdmitCardSettingService;
import com.School.School_management.auth.CurrentUser;
import java.util.Objects;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AdmitCardSettingServiceImpl implements AdmitCardSettingService {

    private final AdmitCardSettingRepository admitCardSettingRepository;
    private final SchoolRepository schoolRepository;
    private final HeadOfficeRepository headOfficeRepository;

    public AdmitCardSettingServiceImpl(
            AdmitCardSettingRepository admitCardSettingRepository,
            SchoolRepository schoolRepository,
            HeadOfficeRepository headOfficeRepository
    ) {
        this.admitCardSettingRepository = admitCardSettingRepository;
        this.schoolRepository = schoolRepository;
        this.headOfficeRepository = headOfficeRepository;
    }

    @Override
    public Page<AdmitCardSettingDto> list(Long headOfficeId, Long schoolId, String search, int page, int size, CurrentUser user) {
        ResolvedScope scope = resolveListScope(user, headOfficeId, schoolId);
        String normalizedSearch = normalizeSearch(search);
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id"));
        return admitCardSettingRepository.searchAdmitCardSettings(scope.headOfficeId(), scope.schoolId(), normalizedSearch, pageable).map(this::toDto);
    }

    @Override
    public AdmitCardSettingDto getById(Long id, CurrentUser user) {
        AdmitCardSetting setting = admitCardSettingRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        ensureVisibleToUser(setting, user);
        return toDto(setting);
    }

    @Override
    public AdmitCardSettingDto create(AdmitCardSettingDto dto, CurrentUser user) {
        ResolvedScope scope = resolveWriteScope(user, dto);
        AdmitCardSetting setting = new AdmitCardSetting();
        applyDto(dto, setting);
        setting.setHeadOfficeId(scope.headOfficeId());
        setting.setSchoolId(scope.schoolId());
        return toDto(admitCardSettingRepository.save(setting));
    }

    @Override
    public AdmitCardSettingDto update(Long id, AdmitCardSettingDto dto, CurrentUser user) {
        AdmitCardSetting setting = admitCardSettingRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        ensureVisibleToUser(setting, user);
        ResolvedScope scope = resolveWriteScope(user, dto);
        applyDto(dto, setting);
        setting.setHeadOfficeId(scope.headOfficeId());
        setting.setSchoolId(scope.schoolId());
        return toDto(admitCardSettingRepository.save(setting));
    }

    @Override
    public void delete(Long id, CurrentUser user) {
        AdmitCardSetting setting = admitCardSettingRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        ensureVisibleToUser(setting, user);
        admitCardSettingRepository.delete(setting);
    }

    private void ensureVisibleToUser(AdmitCardSetting setting, CurrentUser user) {
        if (user == null) {
            throw new ForbiddenException();
        }
        if (user.isSuperAdmin()) {
            return;
        }
        if (user.isHeadOfficeScopedAdmin()) {
            if (!Objects.equals(user.headOfficeId(), setting.getHeadOfficeId())) {
                throw new NotFoundException();
            }
            return;
        }
        if (user.isSchoolScopedAdminUser()) {
            if (!Objects.equals(user.schoolId(), setting.getSchoolId())) {
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
                    throw new BadRequestException("School does not belong to the selected head office");
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

    private ResolvedScope resolveWriteScope(CurrentUser user, AdmitCardSettingDto dto) {
        if (user == null) {
            throw new ForbiddenException();
        }

        Long requestedHeadOfficeId = normalizeId(dto.getHeadOfficeId());
        Long requestedSchoolId = normalizeId(dto.getSchoolId());

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

    private void applyDto(AdmitCardSettingDto dto, AdmitCardSetting setting) {
        setting.setBorderColor(requiredText(dto.getBorderColor(), "Border color is required"));
        setting.setTopBackground(requiredText(dto.getTopBackground(), "Top background is required"));
        setting.setCardSchoolName(safeTrim(dto.getCardSchoolName()));
        setting.setSchoolNameFontSize(safeTrim(dto.getSchoolNameFontSize()));
        setting.setSchoolNameColor(safeTrim(dto.getSchoolNameColor()));
        setting.setSchoolAddress(safeTrim(dto.getSchoolAddress()));
        setting.setSchoolAddressColor(safeTrim(dto.getSchoolAddressColor()));
        setting.setAdmitTitleFontSize(safeTrim(dto.getAdmitTitleFontSize()));
        setting.setAdmitTitleColor(safeTrim(dto.getAdmitTitleColor()));
        setting.setAdmitTitleBackground(safeTrim(dto.getAdmitTitleBackground()));
        setting.setTitleFontSize(safeTrim(dto.getTitleFontSize()));
        setting.setTitleColor(safeTrim(dto.getTitleColor()));
        setting.setValueFontSize(safeTrim(dto.getValueFontSize()));
        setting.setValueColor(safeTrim(dto.getValueColor()));
        setting.setExamTitleFontSize(safeTrim(dto.getExamTitleFontSize()));
        setting.setExamTitleColor(safeTrim(dto.getExamTitleColor()));
        setting.setSubjectFontSize(safeTrim(dto.getSubjectFontSize()));
        setting.setSubjectColor(safeTrim(dto.getSubjectColor()));
        setting.setBottomSignature(requiredText(dto.getBottomSignature(), "Bottom signature is required"));
        setting.setSignatureBackground(requiredText(dto.getSignatureBackground(), "Signature background is required"));
        setting.setSignatureColor(safeTrim(dto.getSignatureColor()));
        setting.setSignatureAlign(safeTrim(dto.getSignatureAlign()));
        setting.setCardLogoUrl(safeTrim(dto.getCardLogoUrl()));
    }

    private AdmitCardSettingDto toDto(AdmitCardSetting setting) {
        AdmitCardSettingDto dto = new AdmitCardSettingDto();
        dto.setId(setting.getId());
        dto.setHeadOfficeId(setting.getHeadOfficeId());
        dto.setHeadOfficeName(resolveHeadOfficeName(setting.getHeadOfficeId()));
        dto.setSchoolId(setting.getSchoolId());
        dto.setSchoolName(resolveSchoolName(setting.getSchoolId()));
        dto.setBorderColor(setting.getBorderColor());
        dto.setTopBackground(setting.getTopBackground());
        dto.setCardSchoolName(setting.getCardSchoolName());
        dto.setSchoolNameFontSize(setting.getSchoolNameFontSize());
        dto.setSchoolNameColor(setting.getSchoolNameColor());
        dto.setSchoolAddress(setting.getSchoolAddress());
        dto.setSchoolAddressColor(setting.getSchoolAddressColor());
        dto.setAdmitTitleFontSize(setting.getAdmitTitleFontSize());
        dto.setAdmitTitleColor(setting.getAdmitTitleColor());
        dto.setAdmitTitleBackground(setting.getAdmitTitleBackground());
        dto.setTitleFontSize(setting.getTitleFontSize());
        dto.setTitleColor(setting.getTitleColor());
        dto.setValueFontSize(setting.getValueFontSize());
        dto.setValueColor(setting.getValueColor());
        dto.setExamTitleFontSize(setting.getExamTitleFontSize());
        dto.setExamTitleColor(setting.getExamTitleColor());
        dto.setSubjectFontSize(setting.getSubjectFontSize());
        dto.setSubjectColor(setting.getSubjectColor());
        dto.setBottomSignature(setting.getBottomSignature());
        dto.setSignatureBackground(setting.getSignatureBackground());
        dto.setSignatureColor(setting.getSignatureColor());
        dto.setSignatureAlign(setting.getSignatureAlign());
        dto.setCardLogoUrl(setting.getCardLogoUrl());
        dto.setCreatedAt(setting.getCreatedAt());
        dto.setUpdatedAt(setting.getUpdatedAt());
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

    private String safeTrim(String value) {
        return value == null ? null : value.trim();
    }

    private String requiredText(String value, String message) {
        String trimmed = safeTrim(value);
        if (trimmed == null || trimmed.isEmpty()) {
            throw new BadRequestException(message);
        }
        return trimmed;
    }

    private record ResolvedScope(Long headOfficeId, Long schoolId) {
    }
}
