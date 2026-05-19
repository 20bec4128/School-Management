package com.School.School_management.Service;

import com.School.School_management.Dto.EmailSettingDto;

import java.util.List;

public interface EmailSettingService {
    List<EmailSettingDto> list(Long headOfficeId, Long schoolId);
    EmailSettingDto findById(Long id);
    EmailSettingDto create(EmailSettingDto dto);
    EmailSettingDto update(Long id, EmailSettingDto dto);
    void delete(Long id);
}
