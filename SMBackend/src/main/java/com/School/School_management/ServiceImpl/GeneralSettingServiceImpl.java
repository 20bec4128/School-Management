package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.GeneralSettingDto;
import com.School.School_management.Entity.GeneralSetting;
import com.School.School_management.Repository.GeneralSettingRepository;
import com.School.School_management.Service.GeneralSettingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class GeneralSettingServiceImpl implements GeneralSettingService {

    @Autowired
    private GeneralSettingRepository repository;

    @Override
    public List<GeneralSettingDto> list(Long headOfficeId, Long schoolId) {
        return repository.findByScope(headOfficeId, schoolId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<GeneralSettingDto> listPaginated(Long headOfficeId, Long schoolId, int page, int size, String search) {
        String cleanSearch = (search != null) ? search.trim() : "";
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return repository.findByScopeWithSearch(headOfficeId, schoolId, cleanSearch, pageable)
                .map(this::convertToDto);
    }

    @Override
    public GeneralSettingDto findById(Long id) {
        GeneralSetting entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("General settings not found for id: " + id));
        return convertToDto(entity);
    }

    @Override
    public GeneralSettingDto findBySchoolId(Long schoolId) {
        GeneralSetting entity = repository.findBySchoolId(schoolId)
                .orElseThrow(() -> new RuntimeException("General settings not found for school: " + schoolId));
        return convertToDto(entity);
    }

    @Override
    @Transactional
    public GeneralSettingDto create(GeneralSettingDto dto) {
        if (dto.getSchoolId() == null) {
            throw new IllegalArgumentException("School scope is required.");
        }
        if (dto.getBrandName() == null || dto.getBrandName().trim().isEmpty()) {
            throw new IllegalArgumentException("Brand Name is required.");
        }
        if (dto.getBrandTitle() == null || dto.getBrandTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Brand Title is required.");
        }

        GeneralSetting entity = convertToEntity(dto);
        GeneralSetting saved = repository.save(entity);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public GeneralSettingDto update(Long id, GeneralSettingDto dto) {
        GeneralSetting existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("General settings not found for id: " + id));

        if (dto.getSchoolId() == null) {
            throw new IllegalArgumentException("School scope is required.");
        }
        if (dto.getBrandName() == null || dto.getBrandName().trim().isEmpty()) {
            throw new IllegalArgumentException("Brand Name is required.");
        }
        if (dto.getBrandTitle() == null || dto.getBrandTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Brand Title is required.");
        }

        existing.setHeadOfficeId(dto.getHeadOfficeId());
        existing.setSchoolId(dto.getSchoolId());
        existing.setSchoolName(dto.getSchoolName() != null ? dto.getSchoolName() : dto.getSchool());
        existing.setBrandName(dto.getBrandName());
        existing.setBrandTitle(dto.getBrandTitle());
        existing.setLanguage(dto.getLanguage());
        existing.setCurrency(dto.getCurrency());
        existing.setCurrencySymbol(dto.getCurrencySymbol());
        existing.setEnableRtl(dto.getEnableRtl());
        existing.setEnableFrontend(dto.getEnableFrontend());
        existing.setTheme(dto.getTheme());
        existing.setTimeZone(dto.getTimeZone());
        existing.setDateFormat(dto.getDateFormat());
        
        if (dto.getBrandLogo() != null) {
            existing.setBrandLogo(dto.getBrandLogo());
        }
        if (dto.getFaviconIcon() != null) {
            existing.setFaviconIcon(dto.getFaviconIcon());
        }
        
        existing.setBrandFooter(dto.getBrandFooter());
        existing.setGoogleAnalytics(dto.getGoogleAnalytics());

        GeneralSetting updated = repository.save(existing);
        return convertToDto(updated);
    }

    @Override
    @Transactional
    public GeneralSettingDto saveOrUpdate(GeneralSettingDto dto) {
        if (dto.getSchoolId() == null) {
            throw new IllegalArgumentException("School scope is required.");
        }
        Optional<GeneralSetting> existingOpt = repository.findBySchoolId(dto.getSchoolId());
        if (existingOpt.isPresent()) {
            return update(existingOpt.get().getId(), dto);
        } else {
            return create(dto);
        }
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("General settings not found for id: " + id);
        }
        repository.deleteById(id);
    }

    private GeneralSettingDto convertToDto(GeneralSetting entity) {
        return GeneralSettingDto.builder()
                .id(entity.getId())
                .headOfficeId(entity.getHeadOfficeId())
                .schoolId(entity.getSchoolId())
                .schoolName(entity.getSchoolName())
                .school(entity.getSchoolName())
                .brandName(entity.getBrandName())
                .brandTitle(entity.getBrandTitle())
                .language(entity.getLanguage())
                .currency(entity.getCurrency())
                .currencySymbol(entity.getCurrencySymbol())
                .enableRtl(entity.getEnableRtl())
                .enableFrontend(entity.getEnableFrontend())
                .theme(entity.getTheme())
                .timeZone(entity.getTimeZone())
                .dateFormat(entity.getDateFormat())
                .brandLogo(entity.getBrandLogo())
                .faviconIcon(entity.getFaviconIcon())
                .brandFooter(entity.getBrandFooter())
                .googleAnalytics(entity.getGoogleAnalytics())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private GeneralSetting convertToEntity(GeneralSettingDto dto) {
        return GeneralSetting.builder()
                .headOfficeId(dto.getHeadOfficeId())
                .schoolId(dto.getSchoolId())
                .schoolName(dto.getSchoolName() != null ? dto.getSchoolName() : dto.getSchool())
                .brandName(dto.getBrandName())
                .brandTitle(dto.getBrandTitle())
                .language(dto.getLanguage())
                .currency(dto.getCurrency())
                .currencySymbol(dto.getCurrencySymbol())
                .enableRtl(dto.getEnableRtl())
                .enableFrontend(dto.getEnableFrontend())
                .theme(dto.getTheme())
                .timeZone(dto.getTimeZone())
                .dateFormat(dto.getDateFormat())
                .brandLogo(dto.getBrandLogo())
                .faviconIcon(dto.getFaviconIcon())
                .brandFooter(dto.getBrandFooter())
                .googleAnalytics(dto.getGoogleAnalytics())
                .build();
    }
}
