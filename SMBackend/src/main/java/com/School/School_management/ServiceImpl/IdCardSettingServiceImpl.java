package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.IdCardSettingDto;
import com.School.School_management.Entity.HeadOffice;
import com.School.School_management.Entity.IdCardSetting;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.HeadOfficeRepository;
import com.School.School_management.Repository.IdCardSettingRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.IdCardSettingService;
import com.School.School_management.auth.CurrentUser;
import java.util.Objects;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class IdCardSettingServiceImpl implements IdCardSettingService {

    private final IdCardSettingRepository idCardSettingRepository;
    private final SchoolRepository schoolRepository;
    private final HeadOfficeRepository headOfficeRepository;

    public IdCardSettingServiceImpl(
            IdCardSettingRepository idCardSettingRepository,
            SchoolRepository schoolRepository,
            HeadOfficeRepository headOfficeRepository
    ) {
        this.idCardSettingRepository = idCardSettingRepository;
        this.schoolRepository = schoolRepository;
        this.headOfficeRepository = headOfficeRepository;
    }

    @Override
    public Page<IdCardSettingDto> list(Long headOfficeId, Long schoolId, String search, int page, int size, CurrentUser user) {
        ResolvedScope scope = resolveListScope(user, headOfficeId, schoolId);
        String normalizedSearch = normalizeSearch(search);
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id"));
        return idCardSettingRepository.searchIdCardSettings(scope.headOfficeId(), scope.schoolId(), normalizedSearch, pageable).map(this::toDto);
    }

    @Override
    public IdCardSettingDto getById(Long id, CurrentUser user) {
        IdCardSetting setting = idCardSettingRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        ensureVisibleToUser(setting, user);
        return toDto(setting);
    }

    @Override
    public IdCardSettingDto create(IdCardSettingDto dto, CurrentUser user) {
        ResolvedScope scope = resolveWriteScope(user, dto);
        IdCardSetting setting = new IdCardSetting();
        applyDto(dto, setting);
        setting.setHeadOfficeId(scope.headOfficeId());
        setting.setSchoolId(scope.schoolId());
        return toDto(idCardSettingRepository.save(setting));
    }

    @Override
    public IdCardSettingDto update(Long id, IdCardSettingDto dto, CurrentUser user) {
        IdCardSetting setting = idCardSettingRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        ensureVisibleToUser(setting, user);
        ResolvedScope scope = resolveWriteScope(user, dto);
        applyDto(dto, setting);
        setting.setHeadOfficeId(scope.headOfficeId());
        setting.setSchoolId(scope.schoolId());
        return toDto(idCardSettingRepository.save(setting));
    }

    @Override
    public void delete(Long id, CurrentUser user) {
        IdCardSetting setting = idCardSettingRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        ensureVisibleToUser(setting, user);
        idCardSettingRepository.delete(setting);
    }

    private void ensureVisibleToUser(IdCardSetting setting, CurrentUser user) {
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

    private ResolvedScope resolveWriteScope(CurrentUser user, IdCardSettingDto dto) {
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

    private HeadOffice requireHeadOffice(Long headOfficeId) {
        return headOfficeRepository.findById(headOfficeId)
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

    private void applyDto(IdCardSettingDto dto, IdCardSetting setting) {
        setting.setBorderColor(requiredText(dto.getBorderColor(), "Border color is required"));
        setting.setTopBackground(requiredText(dto.getTopBackground(), "Top background is required"));
        setting.setCardSchoolName(safeTrim(dto.getCardSchoolName()));
        setting.setSchoolNameFontSize(safeTrim(dto.getSchoolNameFontSize()));
        setting.setSchoolNameColor(safeTrim(dto.getSchoolNameColor()));
        setting.setSchoolAddress(safeTrim(dto.getSchoolAddress()));
        setting.setSchoolAddressColor(safeTrim(dto.getSchoolAddressColor()));
        setting.setIdNoFontSize(safeTrim(dto.getIdNoFontSize()));
        setting.setIdNoColor(safeTrim(dto.getIdNoColor()));
        setting.setIdNoBackground(safeTrim(dto.getIdNoBackground()));
        setting.setTitleFontSize(safeTrim(dto.getTitleFontSize()));
        setting.setTitleColor(safeTrim(dto.getTitleColor()));
        setting.setValueFontSize(safeTrim(dto.getValueFontSize()));
        setting.setValueColor(safeTrim(dto.getValueColor()));
        setting.setBottomSignature(requiredText(dto.getBottomSignature(), "Bottom signature is required"));
        setting.setSignatureBackground(requiredText(dto.getSignatureBackground(), "Signature background is required"));
        setting.setSignatureColor(safeTrim(dto.getSignatureColor()));
        setting.setSignatureAlign(safeTrim(dto.getSignatureAlign()));
        setting.setCardLogoUrl(safeTrim(dto.getCardLogoUrl()));
    }

    private IdCardSettingDto toDto(IdCardSetting setting) {
        IdCardSettingDto dto = new IdCardSettingDto();
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
        dto.setIdNoFontSize(setting.getIdNoFontSize());
        dto.setIdNoColor(setting.getIdNoColor());
        dto.setIdNoBackground(setting.getIdNoBackground());
        dto.setTitleFontSize(setting.getTitleFontSize());
        dto.setTitleColor(setting.getTitleColor());
        dto.setValueFontSize(setting.getValueFontSize());
        dto.setValueColor(setting.getValueColor());
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
