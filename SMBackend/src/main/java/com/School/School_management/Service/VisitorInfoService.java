package com.School.School_management.Service;

import com.School.School_management.Dto.VisitorInfoDto;
import java.util.List;

public interface VisitorInfoService {
    List<VisitorInfoDto> getAllBySchool(Long schoolId);
    VisitorInfoDto save(VisitorInfoDto dto);
    VisitorInfoDto update(Long id, VisitorInfoDto dto);
    void delete(Long id);
}
