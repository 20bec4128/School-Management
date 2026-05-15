package com.School.School_management.Service;

import com.School.School_management.Dto.IncomeHeadDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface IncomeHeadService {
    List<IncomeHeadDto> list(Long schoolId);
    Page<IncomeHeadDto> listPaginated(Long schoolId, int page, int size, String search);
    IncomeHeadDto create(IncomeHeadDto dto);
    IncomeHeadDto update(Long id, IncomeHeadDto dto);
    void delete(Long id);
}
