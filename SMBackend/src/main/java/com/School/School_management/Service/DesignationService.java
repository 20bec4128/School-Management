package com.School.School_management.Service;

import com.School.School_management.Dto.DesignationDto;
import org.springframework.data.domain.Page;
import java.util.List;

public interface DesignationService {
    List<DesignationDto> list(Long schoolId, String role);
    Page<DesignationDto> listPaginated(Long schoolId, int page, int size, String search);
    DesignationDto create(DesignationDto dto);
    DesignationDto update(Long id, DesignationDto dto);
    void delete(Long id);
}
