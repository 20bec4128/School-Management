package com.School.School_management.Service;

import com.School.School_management.Dto.AdmitCardSettingDto;
import com.School.School_management.auth.CurrentUser;
import org.springframework.data.domain.Page;

public interface AdmitCardSettingService {
    Page<AdmitCardSettingDto> list(Long headOfficeId, Long schoolId, String search, int page, int size, CurrentUser user);

    AdmitCardSettingDto getById(Long id, CurrentUser user);

    AdmitCardSettingDto create(AdmitCardSettingDto dto, CurrentUser user);

    AdmitCardSettingDto update(Long id, AdmitCardSettingDto dto, CurrentUser user);

    void delete(Long id, CurrentUser user);
}

