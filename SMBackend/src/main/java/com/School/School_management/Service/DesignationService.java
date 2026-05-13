package com.School.School_management.Service;

import com.School.School_management.Dto.DesignationDto;
import java.util.List;

public interface DesignationService {
    List<DesignationDto> list(Long schoolId, String role);
    DesignationDto create(DesignationDto dto);
    DesignationDto update(Long id, DesignationDto dto);
    void delete(Long id);
}
