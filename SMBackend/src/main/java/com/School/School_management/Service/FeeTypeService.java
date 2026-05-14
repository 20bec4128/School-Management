package com.School.School_management.Service;

import com.School.School_management.Dto.FeeTypeDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface FeeTypeService {
    List<FeeTypeDto> list(Long schoolId);
    Page<FeeTypeDto> listPaginated(Long schoolId, int page, int size, String search);
    FeeTypeDto create(FeeTypeDto dto);
    FeeTypeDto update(Long id, FeeTypeDto dto);
    void delete(Long id);
}
