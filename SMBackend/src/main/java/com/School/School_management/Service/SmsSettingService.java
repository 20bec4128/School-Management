package com.School.School_management.Service;

import com.School.School_management.Dto.SmsSettingDto;
import org.springframework.data.domain.Page;
import java.util.List;

public interface SmsSettingService {
    List<SmsSettingDto> list(Long headOfficeId, Long schoolId);
    Page<SmsSettingDto> listPaginated(Long headOfficeId, Long schoolId, int page, int size, String search);
    SmsSettingDto findById(Long id);
    SmsSettingDto create(SmsSettingDto dto);
    SmsSettingDto update(Long id, SmsSettingDto dto);
    void delete(Long id);
}
