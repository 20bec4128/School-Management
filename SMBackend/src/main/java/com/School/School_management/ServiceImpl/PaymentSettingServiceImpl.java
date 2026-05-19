package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.PaymentSettingDto;
import com.School.School_management.Entity.PaymentSetting;
import com.School.School_management.Repository.PaymentSettingRepository;
import com.School.School_management.Service.PaymentSettingService;
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
public class PaymentSettingServiceImpl implements PaymentSettingService {

    @Autowired
    private PaymentSettingRepository repository;

    @Override
    public List<PaymentSettingDto> list(Long headOfficeId, Long schoolId) {
        return repository.findByScope(headOfficeId, schoolId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<PaymentSettingDto> listPaginated(Long headOfficeId, Long schoolId, int page, int size, String search) {
        String cleanSearch = (search != null) ? search.trim() : "";
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return repository.findByScopeWithSearch(headOfficeId, schoolId, cleanSearch, pageable)
                .map(this::convertToDto);
    }

    @Override
    public PaymentSettingDto findById(Long id) {
        PaymentSetting entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment setting config not found for id: " + id));
        return convertToDto(entity);
    }

    @Override
    @Transactional
    public PaymentSettingDto create(PaymentSettingDto dto) {
        if (dto.getSchoolId() == null) {
            throw new IllegalArgumentException("School scope is required.");
        }
        if (dto.getGateway() == null || dto.getGateway().trim().isEmpty()) {
            throw new IllegalArgumentException("Gateway name is required.");
        }

        PaymentSetting entity = convertToEntity(dto);
        PaymentSetting saved = repository.save(entity);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public PaymentSettingDto update(Long id, PaymentSettingDto dto) {
        PaymentSetting existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment setting config not found for id: " + id));

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
        existing.setPaypalEmail(dto.getPaypalEmail() != null ? dto.getPaypalEmail() : dto.getPaypal());
        existing.setSecretKey(dto.getSecretKey() != null ? dto.getSecretKey() : dto.getPayStack());
        existing.setPublishableKey(dto.getPublishableKey());
        existing.setPayumoneyKey(dto.getPayumoneyKey() != null ? dto.getPayumoneyKey() : dto.getPayUMoney());
        existing.setKeySalt(dto.getKeySalt());
        existing.setMerchantId(dto.getMerchantId() != null ? dto.getMerchantId() : dto.getCcaVenue());
        existing.setWorkingKey(dto.getWorkingKey());
        existing.setAccessCode(dto.getAccessCode());
        existing.setMerchantKey(dto.getMerchantKey());
        existing.setMerchantMid(dto.getMerchantMid() != null ? dto.getMerchantMid() : dto.getPayTM());
        existing.setWebsite(dto.getWebsite());
        existing.setIndustryType(dto.getIndustryType());
        existing.setPublicKey(dto.getPublicKey());
        existing.setPassword(dto.getPassword());
        existing.setStoreId(dto.getStoreId());
        existing.setUserId(dto.getUserId());
        existing.setSubmerName(dto.getSubmerName());
        existing.setSubmerId(dto.getSubmerId());
        existing.setTerminalId(dto.getTerminalId());
        existing.setClientKey(dto.getClientKey());
        existing.setServerKey(dto.getServerKey());
        existing.setApiKey(dto.getApiKey());
        existing.setAuthToken(dto.getAuthToken());
        existing.setVendorId(dto.getVendorId());
        existing.setHashKey(dto.getHashKey());
        existing.setIsDemo(dto.getIsDemo());
        existing.setExtraCharge(dto.getExtraCharge());
        existing.setIsActive(dto.getIsActive());

        PaymentSetting updated = repository.save(existing);
        return convertToDto(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Payment setting config not found for id: " + id);
        }
        repository.deleteById(id);
    }

    private PaymentSettingDto convertToDto(PaymentSetting entity) {
        PaymentSettingDto dto = new PaymentSettingDto();
        dto.setId(entity.getId());
        dto.setHeadOfficeId(entity.getHeadOfficeId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setSchoolName(entity.getSchoolName());
        dto.setSchool(entity.getSchoolName());
        dto.setGateway(entity.getGateway());
        dto.setPaypalEmail(entity.getPaypalEmail());
        dto.setPaypal(entity.getPaypalEmail());
        dto.setSecretKey(entity.getSecretKey());
        dto.setPublishableKey(entity.getPublishableKey());
        dto.setPayumoneyKey(entity.getPayumoneyKey());
        dto.setPayUMoney(entity.getPayumoneyKey());
        dto.setKeySalt(entity.getKeySalt());
        dto.setMerchantId(entity.getMerchantId());
        dto.setCcaVenue(entity.getMerchantId());
        dto.setWorkingKey(entity.getWorkingKey());
        dto.setAccessCode(entity.getAccessCode());
        dto.setMerchantKey(entity.getMerchantKey());
        dto.setMerchantMid(entity.getMerchantMid());
        dto.setPayTM(entity.getMerchantMid());
        dto.setWebsite(entity.getWebsite());
        dto.setIndustryType(entity.getIndustryType());
        dto.setPublicKey(entity.getPublicKey());
        dto.setPayStack(entity.getSecretKey()); // payStack uses secretKey in PayPal/Stripe forms
        dto.setPassword(entity.getPassword());
        dto.setStoreId(entity.getStoreId());
        dto.setUserId(entity.getUserId());
        dto.setSubmerName(entity.getSubmerName());
        dto.setSubmerId(entity.getSubmerId());
        dto.setTerminalId(entity.getTerminalId());
        dto.setClientKey(entity.getClientKey());
        dto.setServerKey(entity.getServerKey());
        dto.setApiKey(entity.getApiKey());
        dto.setAuthToken(entity.getAuthToken());
        dto.setVendorId(entity.getVendorId());
        dto.setHashKey(entity.getHashKey());
        dto.setIsDemo(entity.getIsDemo());
        dto.setExtraCharge(entity.getExtraCharge());
        dto.setIsActive(entity.getIsActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    private PaymentSetting convertToEntity(PaymentSettingDto dto) {
        return PaymentSetting.builder()
                .headOfficeId(dto.getHeadOfficeId())
                .schoolId(dto.getSchoolId())
                .schoolName(dto.getSchoolName() != null ? dto.getSchoolName() : dto.getSchool())
                .gateway(dto.getGateway())
                .paypalEmail(dto.getPaypalEmail() != null ? dto.getPaypalEmail() : dto.getPaypal())
                .secretKey(dto.getSecretKey() != null ? dto.getSecretKey() : dto.getPayStack())
                .publishableKey(dto.getPublishableKey())
                .payumoneyKey(dto.getPayumoneyKey() != null ? dto.getPayumoneyKey() : dto.getPayUMoney())
                .keySalt(dto.getKeySalt())
                .merchantId(dto.getMerchantId() != null ? dto.getMerchantId() : dto.getCcaVenue())
                .workingKey(dto.getWorkingKey())
                .accessCode(dto.getAccessCode())
                .merchantKey(dto.getMerchantKey())
                .merchantMid(dto.getMerchantMid() != null ? dto.getMerchantMid() : dto.getPayTM())
                .website(dto.getWebsite())
                .industryType(dto.getIndustryType())
                .publicKey(dto.getPublicKey())
                .password(dto.getPassword())
                .storeId(dto.getStoreId())
                .userId(dto.getUserId())
                .submerName(dto.getSubmerName())
                .submerId(dto.getSubmerId())
                .terminalId(dto.getTerminalId())
                .clientKey(dto.getClientKey())
                .serverKey(dto.getServerKey())
                .apiKey(dto.getApiKey())
                .authToken(dto.getAuthToken())
                .vendorId(dto.getVendorId())
                .hashKey(dto.getHashKey())
                .isDemo(dto.getIsDemo())
                .extraCharge(dto.getExtraCharge())
                .isActive(dto.getIsActive())
                .build();
    }
}
