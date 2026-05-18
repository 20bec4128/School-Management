package com.School.School_management.Service;

import com.School.School_management.Dto.AcademicYearDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface AcademicYearService {
    List<AcademicYearDto> list(Long schoolId);

    Page<AcademicYearDto> page(Long schoolId, String search, Boolean running, int page, int size);

    AcademicYearDto create(AcademicYearDto dto);

    AcademicYearDto update(Long id, AcademicYearDto dto);

    void delete(Long id);
}
