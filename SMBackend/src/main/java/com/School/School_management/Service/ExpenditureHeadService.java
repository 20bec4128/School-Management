package com.School.School_management.Service;

import com.School.School_management.Dto.ExpenditureHeadDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface ExpenditureHeadService {
    List<ExpenditureHeadDto> list(Long schoolId);
    Page<ExpenditureHeadDto> listPaginated(Long schoolId, int page, int size, String search);
    ExpenditureHeadDto create(ExpenditureHeadDto dto);
    ExpenditureHeadDto update(Long id, ExpenditureHeadDto dto);
    void delete(Long id);
}
