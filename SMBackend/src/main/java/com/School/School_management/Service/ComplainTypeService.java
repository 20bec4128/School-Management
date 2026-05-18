package com.School.School_management.Service;

import com.School.School_management.Dto.ComplainTypeDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface ComplainTypeService {
    List<ComplainTypeDto> getAllBySchool(Long schoolId);

    Page<ComplainTypeDto> pageBySchool(Long schoolId, String search, int page, int size);

    ComplainTypeDto save(ComplainTypeDto dto);
    ComplainTypeDto update(Long id, ComplainTypeDto dto);
    void delete(Long id);
}
