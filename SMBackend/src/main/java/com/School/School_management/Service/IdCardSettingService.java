package com.School.School_management.Service;

import com.School.School_management.Dto.IdCardSettingDto;
import com.School.School_management.auth.CurrentUser;
import org.springframework.data.domain.Page;

public interface IdCardSettingService {
    Page<IdCardSettingDto> list(Long headOfficeId, Long schoolId, String search, int page, int size, CurrentUser user);

    IdCardSettingDto getById(Long id, CurrentUser user);

    IdCardSettingDto create(IdCardSettingDto dto, CurrentUser user);

    IdCardSettingDto update(Long id, IdCardSettingDto dto, CurrentUser user);

    void delete(Long id, CurrentUser user);
}
