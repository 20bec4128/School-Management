package com.School.School_management.Service;

import com.School.School_management.Dto.GeneralSettingDto;
import org.springframework.data.domain.Page;
import java.util.List;

public interface GeneralSettingService {
    List<GeneralSettingDto> list(Long headOfficeId, Long schoolId);
    Page<GeneralSettingDto> listPaginated(Long headOfficeId, Long schoolId, int page, int size, String search);
    GeneralSettingDto findById(Long id);
    GeneralSettingDto findBySchoolId(Long schoolId);
    GeneralSettingDto create(GeneralSettingDto dto);
    GeneralSettingDto update(Long id, GeneralSettingDto dto);
    GeneralSettingDto saveOrUpdate(GeneralSettingDto dto);
    void delete(Long id);
}
