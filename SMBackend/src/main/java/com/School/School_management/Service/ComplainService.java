package com.School.School_management.Service;

import com.School.School_management.Dto.ComplainDto;
import java.util.List;

public interface ComplainService {
    List<ComplainDto> getAllBySchool(Long schoolId);
    ComplainDto save(ComplainDto dto);
    ComplainDto update(Long id, ComplainDto dto);
    void delete(Long id);
}
