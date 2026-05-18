package com.School.School_management.Service;

import com.School.School_management.Dto.ComplainDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface ComplainService {
    List<ComplainDto> getAllBySchool(Long schoolId);

    Page<ComplainDto> pageBySchool(Long schoolId, String search, String academicYear, Long complainTypeId, String userType, int page, int size);

    ComplainDto save(ComplainDto dto);
    ComplainDto update(Long id, ComplainDto dto);
    void delete(Long id);
}
