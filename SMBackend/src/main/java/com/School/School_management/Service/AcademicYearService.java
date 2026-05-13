package com.School.School_management.Service;

import com.School.School_management.Dto.AcademicYearDto;
import java.util.List;

public interface AcademicYearService {
    List<AcademicYearDto> list(Long schoolId);

    AcademicYearDto create(AcademicYearDto dto);

    AcademicYearDto update(Long id, AcademicYearDto dto);

    void delete(Long id);
}
