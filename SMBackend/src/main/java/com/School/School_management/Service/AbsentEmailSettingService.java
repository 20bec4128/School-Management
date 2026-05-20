package com.School.School_management.Service;

import com.School.School_management.Dto.AbsentEmailSettingDto;

import java.util.List;

public interface AbsentEmailSettingService {
    List<AbsentEmailSettingDto> list(Long headOfficeId, Long schoolId);
    AbsentEmailSettingDto create(AbsentEmailSettingDto dto);
    AbsentEmailSettingDto update(Long id, AbsentEmailSettingDto dto);
    void delete(Long id);
}

