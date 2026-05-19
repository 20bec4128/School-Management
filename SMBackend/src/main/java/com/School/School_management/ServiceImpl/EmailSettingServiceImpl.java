package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.EmailSettingDto;
import com.School.School_management.Entity.EmailSetting;
import com.School.School_management.Repository.EmailSettingRepository;
import com.School.School_management.Service.EmailSettingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmailSettingServiceImpl implements EmailSettingService {

    @Autowired
    private EmailSettingRepository repository;

    @Override
    public List<EmailSettingDto> list(Long headOfficeId, Long schoolId) {
        return repository.findByScope(headOfficeId, schoolId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public EmailSettingDto findById(Long id) {
        EmailSetting entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Email setting not found for id: " + id));
        return convertToDto(entity);
    }

    @Override
    @Transactional
    public EmailSettingDto create(EmailSettingDto dto) {
        validate(dto);
        EmailSetting saved = repository.save(convertToEntity(dto));
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public EmailSettingDto update(Long id, EmailSettingDto dto) {
        EmailSetting existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Email setting not found for id: " + id));

        validate(dto);

        existing.setHeadOfficeId(dto.getHeadOfficeId());
        existing.setSchoolId(dto.getSchoolId());
        existing.setSchoolName(dto.getSchoolName() != null ? dto.getSchoolName() : dto.getSchool());
        existing.setEmailProtocol(dto.getEmailProtocol());
        existing.setEmailType(dto.getEmailType());
        existing.setCharSet(dto.getCharSet());
        existing.setSmtpHost(dto.getSmtpHost());
        existing.setSmtpPort(dto.getSmtpPort());
        existing.setSmtpUsername(dto.getSmtpUsername());
        existing.setSmtpPassword(dto.getSmtpPassword());
        existing.setSmtpSecurity(dto.getSmtpSecurity());
        existing.setSmtpTimeout(dto.getSmtpTimeout());
        existing.setPriority(dto.getPriority());
        existing.setFromName(dto.getFromName());
        existing.setFromEmail(dto.getFromEmail());

        EmailSetting saved = repository.save(existing);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Email setting not found for id: " + id);
        }
        repository.deleteById(id);
    }

    private void validate(EmailSettingDto dto) {
        if (dto.getSchoolId() == null) throw new IllegalArgumentException("School scope is required.");
        if (dto.getEmailProtocol() == null || dto.getEmailProtocol().trim().isEmpty()) throw new IllegalArgumentException("Email protocol is required.");
        if (dto.getEmailType() == null || dto.getEmailType().trim().isEmpty()) throw new IllegalArgumentException("Email type is required.");
        if (dto.getCharSet() == null || dto.getCharSet().trim().isEmpty()) throw new IllegalArgumentException("Char set is required.");
        if (dto.getSmtpHost() == null || dto.getSmtpHost().trim().isEmpty()) throw new IllegalArgumentException("SMTP host is required.");
        if (dto.getSmtpPort() == null) throw new IllegalArgumentException("SMTP port is required.");
        if (dto.getSmtpUsername() == null || dto.getSmtpUsername().trim().isEmpty()) throw new IllegalArgumentException("SMTP username is required.");
        if (dto.getSmtpPassword() == null || dto.getSmtpPassword().trim().isEmpty()) throw new IllegalArgumentException("SMTP password is required.");
        if (dto.getFromName() == null || dto.getFromName().trim().isEmpty()) throw new IllegalArgumentException("From name is required.");
        if (dto.getFromEmail() == null || dto.getFromEmail().trim().isEmpty()) throw new IllegalArgumentException("From email is required.");
        if (dto.getSmtpTimeout() != null && (dto.getSmtpTimeout() < 5 || dto.getSmtpTimeout() > 10)) {
            throw new IllegalArgumentException("SMTP timeout must be between 5 and 10 seconds.");
        }
    }

    private EmailSettingDto convertToDto(EmailSetting entity) {
        return EmailSettingDto.builder()
                .id(entity.getId())
                .headOfficeId(entity.getHeadOfficeId())
                .schoolId(entity.getSchoolId())
                .schoolName(entity.getSchoolName())
                .school(entity.getSchoolName())
                .emailProtocol(entity.getEmailProtocol())
                .emailType(entity.getEmailType())
                .charSet(entity.getCharSet())
                .smtpHost(entity.getSmtpHost())
                .smtpPort(entity.getSmtpPort())
                .smtpUsername(entity.getSmtpUsername())
                .smtpPassword(entity.getSmtpPassword())
                .smtpSecurity(entity.getSmtpSecurity())
                .smtpTimeout(entity.getSmtpTimeout())
                .priority(entity.getPriority())
                .fromName(entity.getFromName())
                .fromEmail(entity.getFromEmail())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private EmailSetting convertToEntity(EmailSettingDto dto) {
        return EmailSetting.builder()
                .headOfficeId(dto.getHeadOfficeId())
                .schoolId(dto.getSchoolId())
                .schoolName(dto.getSchoolName() != null ? dto.getSchoolName() : dto.getSchool())
                .emailProtocol(dto.getEmailProtocol())
                .emailType(dto.getEmailType())
                .charSet(dto.getCharSet())
                .smtpHost(dto.getSmtpHost())
                .smtpPort(dto.getSmtpPort())
                .smtpUsername(dto.getSmtpUsername())
                .smtpPassword(dto.getSmtpPassword())
                .smtpSecurity(dto.getSmtpSecurity())
                .smtpTimeout(dto.getSmtpTimeout())
                .priority(dto.getPriority())
                .fromName(dto.getFromName())
                .fromEmail(dto.getFromEmail())
                .build();
    }
}
