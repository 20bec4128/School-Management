package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.AbsentEmailSettingDto;
import com.School.School_management.Entity.AbsentEmailSetting;
import com.School.School_management.Repository.AbsentEmailSettingRepository;
import com.School.School_management.Service.AbsentEmailSettingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AbsentEmailSettingServiceImpl implements AbsentEmailSettingService {

    @Autowired
    private AbsentEmailSettingRepository repository;

    @Override
    public List<AbsentEmailSettingDto> list(Long headOfficeId, Long schoolId) {
        return repository.findByScope(headOfficeId, schoolId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AbsentEmailSettingDto create(AbsentEmailSettingDto dto) {
        validate(dto);
        AbsentEmailSetting entity = convertToEntity(dto);
        AbsentEmailSetting saved = repository.save(entity);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public AbsentEmailSettingDto update(Long id, AbsentEmailSettingDto dto) {
        AbsentEmailSetting existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Absent email setting not found for id: " + id));
        validate(dto);
        existing.setHeadOfficeId(dto.getHeadOfficeId());
        existing.setSchoolId(dto.getSchoolId());
        existing.setEnabled(dto.getEnabled());
        existing.setReceiverType(dto.getReceiverType());
        existing.setSubjectTemplate(dto.getSubjectTemplate());
        existing.setEmailBodyTemplate(dto.getEmailBodyTemplate());
        AbsentEmailSetting updated = repository.save(existing);
        return convertToDto(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Absent email setting not found for id: " + id);
        }
        repository.deleteById(id);
    }

    private void validate(AbsentEmailSettingDto dto) {
        if (dto.getSchoolId() == null) {
            throw new IllegalArgumentException("School context scope is required.");
        }
        if (dto.getSubjectTemplate() == null || dto.getSubjectTemplate().trim().isEmpty()) {
            throw new IllegalArgumentException("Subject template is required.");
        }
        if (dto.getEmailBodyTemplate() == null || dto.getEmailBodyTemplate().trim().isEmpty()) {
            throw new IllegalArgumentException("Email body template is required.");
        }
    }

    private AbsentEmailSettingDto convertToDto(AbsentEmailSetting entity) {
        return AbsentEmailSettingDto.builder()
                .id(entity.getId())
                .headOfficeId(entity.getHeadOfficeId())
                .schoolId(entity.getSchoolId())
                .enabled(entity.getEnabled())
                .receiverType(entity.getReceiverType())
                .subjectTemplate(entity.getSubjectTemplate())
                .emailBodyTemplate(entity.getEmailBodyTemplate())
                .build();
    }

    private AbsentEmailSetting convertToEntity(AbsentEmailSettingDto dto) {
        AbsentEmailSetting entity = new AbsentEmailSetting();
        entity.setHeadOfficeId(dto.getHeadOfficeId());
        entity.setSchoolId(dto.getSchoolId());
        entity.setEnabled(dto.getEnabled() != null ? dto.getEnabled() : Boolean.TRUE);
        entity.setReceiverType((dto.getReceiverType() == null || dto.getReceiverType().trim().isEmpty()) ? "Student" : dto.getReceiverType());
        entity.setSubjectTemplate(dto.getSubjectTemplate());
        entity.setEmailBodyTemplate(dto.getEmailBodyTemplate());
        return entity;
    }
}

