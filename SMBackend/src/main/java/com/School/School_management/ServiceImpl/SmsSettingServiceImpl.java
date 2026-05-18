package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.SmsSettingDto;
import com.School.School_management.Entity.SmsSetting;
import com.School.School_management.Repository.SmsSettingRepository;
import com.School.School_management.Service.SmsSettingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SmsSettingServiceImpl implements SmsSettingService {

    @Autowired
    private SmsSettingRepository repository;

    @Override
    public List<SmsSettingDto> list(Long headOfficeId, Long schoolId) {
        return repository.findByScope(headOfficeId, schoolId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<SmsSettingDto> listPaginated(Long headOfficeId, Long schoolId, int page, int size, String search) {
        String cleanSearch = (search != null) ? search.trim() : "";
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return repository.findByScopeWithSearch(headOfficeId, schoolId, cleanSearch, pageable)
                .map(this::convertToDto);
    }

    @Override
    public SmsSettingDto findById(Long id) {
        SmsSetting entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("SMS setting config not found for id: " + id));
        return convertToDto(entity);
    }

    @Override
    @Transactional
    public SmsSettingDto create(SmsSettingDto dto) {
        if (dto.getSchoolId() == null) {
            throw new IllegalArgumentException("School scope is required.");
        }
        if (dto.getGateway() == null || dto.getGateway().trim().isEmpty()) {
            throw new IllegalArgumentException("Gateway name is required.");
        }

        SmsSetting entity = convertToEntity(dto);
        SmsSetting saved = repository.save(entity);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public SmsSettingDto update(Long id, SmsSettingDto dto) {
        SmsSetting existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("SMS setting config not found for id: " + id));

        if (dto.getSchoolId() == null) {
            throw new IllegalArgumentException("School scope is required.");
        }
        if (dto.getGateway() == null || dto.getGateway().trim().isEmpty()) {
            throw new IllegalArgumentException("Gateway name is required.");
        }

        existing.setHeadOfficeId(dto.getHeadOfficeId());
        existing.setSchoolId(dto.getSchoolId());
        existing.setSchoolName(dto.getSchoolName() != null ? dto.getSchoolName() : dto.getSchool());
        existing.setGateway(dto.getGateway());
        
        // Resolve value from standard property or helper property
        existing.setAccountSid(dto.getAccountSid() != null ? dto.getAccountSid() : dto.getTwilio());
        existing.setAuthToken(dto.getAuthToken());
        existing.setFromNumber(dto.getFromNumber());
        
        // Handle gateway specific username mappings
        String userVal = dto.getUsername();
        if (userVal == null) userVal = dto.getBulk();
        if (userVal == null) userVal = dto.getMsg91();
        if (userVal == null) userVal = dto.getTextLocal();
        if (userVal == null) userVal = dto.getSmsCountry();
        if (userVal == null) userVal = dto.getBetaSms();
        if (userVal == null) userVal = dto.getBulkPk();
        if (userVal == null) userVal = dto.getAlphaNet();
        existing.setUsername(userVal);

        existing.setPassword(dto.getPassword());
        
        existing.setApiKey(dto.getApiKey() != null ? dto.getApiKey() : dto.getMimSms());
        existing.setMoNumber(dto.getMoNumber());
        existing.setAuthId(dto.getAuthId());
        
        existing.setHashKey(dto.getHashKey() != null ? dto.getHashKey() : dto.getBdBulk());
        
        existing.setSenderId(dto.getSenderId());
        existing.setAuthKey(dto.getAuthKey());
        existing.setRouter(dto.getRouter());
        existing.setSmsType(dto.getSmsType());
        existing.setIsActive(dto.getIsActive());

        SmsSetting updated = repository.save(existing);
        return convertToDto(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("SMS setting config not found for id: " + id);
        }
        repository.deleteById(id);
    }

    private SmsSettingDto convertToDto(SmsSetting entity) {
        return SmsSettingDto.builder()
                .id(entity.getId())
                .headOfficeId(entity.getHeadOfficeId())
                .schoolId(entity.getSchoolId())
                .schoolName(entity.getSchoolName())
                .school(entity.getSchoolName())
                .gateway(entity.getGateway())
                .accountSid(entity.getAccountSid())
                .twilio(entity.getAccountSid())
                .authToken(entity.getAuthToken())
                .fromNumber(entity.getFromNumber())
                .username(entity.getUsername())
                .bulk(entity.getUsername())
                .msg91(entity.getUsername())
                .textLocal(entity.getUsername())
                .smsCountry(entity.getUsername())
                .betaSms(entity.getUsername())
                .bulkPk(entity.getUsername())
                .alphaNet(entity.getUsername())
                .password(entity.getPassword())
                .apiKey(entity.getApiKey())
                .mimSms(entity.getApiKey())
                .moNumber(entity.getMoNumber())
                .authId(entity.getAuthId())
                .hashKey(entity.getHashKey())
                .bdBulk(entity.getHashKey())
                .senderId(entity.getSenderId())
                .authKey(entity.getAuthKey())
                .router(entity.getRouter())
                .smsType(entity.getSmsType())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private SmsSetting convertToEntity(SmsSettingDto dto) {
        String userVal = dto.getUsername();
        if (userVal == null) userVal = dto.getBulk();
        if (userVal == null) userVal = dto.getMsg91();
        if (userVal == null) userVal = dto.getTextLocal();
        if (userVal == null) userVal = dto.getSmsCountry();
        if (userVal == null) userVal = dto.getBetaSms();
        if (userVal == null) userVal = dto.getBulkPk();
        if (userVal == null) userVal = dto.getAlphaNet();

        return SmsSetting.builder()
                .headOfficeId(dto.getHeadOfficeId())
                .schoolId(dto.getSchoolId())
                .schoolName(dto.getSchoolName() != null ? dto.getSchoolName() : dto.getSchool())
                .gateway(dto.getGateway())
                .accountSid(dto.getAccountSid() != null ? dto.getAccountSid() : dto.getTwilio())
                .authToken(dto.getAuthToken())
                .fromNumber(dto.getFromNumber())
                .username(userVal)
                .password(dto.getPassword())
                .apiKey(dto.getApiKey() != null ? dto.getApiKey() : dto.getMimSms())
                .moNumber(dto.getMoNumber())
                .authId(dto.getAuthId())
                .hashKey(dto.getHashKey() != null ? dto.getHashKey() : dto.getBdBulk())
                .senderId(dto.getSenderId())
                .authKey(dto.getAuthKey())
                .router(dto.getRouter())
                .smsType(dto.getSmsType())
                .isActive(dto.getIsActive())
                .build();
    }
}
