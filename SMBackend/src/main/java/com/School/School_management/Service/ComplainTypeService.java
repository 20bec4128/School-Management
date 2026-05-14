package com.School.School_management.Service;

import com.School.School_management.Dto.ComplainTypeDto;
import java.util.List;

public interface ComplainTypeService {
    List<ComplainTypeDto> getAllBySchool(Long schoolId);
    ComplainTypeDto save(ComplainTypeDto dto);
    ComplainTypeDto update(Long id, ComplainTypeDto dto);
    void delete(Long id);
}
