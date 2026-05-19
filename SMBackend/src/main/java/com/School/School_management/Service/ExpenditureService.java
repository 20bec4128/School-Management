package com.School.School_management.Service;

import com.School.School_management.Dto.ExpenditureDto;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;

public interface ExpenditureService {
    List<ExpenditureDto> list(Long schoolId);
    Page<ExpenditureDto> listPaginated(
            Long schoolId,
            Long expenditureHeadId,
            String expenditureMethod,
            LocalDate startDate,
            LocalDate endDate,
            int page,
            int size,
            String search
    );
    ExpenditureDto create(ExpenditureDto dto);
    ExpenditureDto update(Long id, ExpenditureDto dto);
    void delete(Long id);
}
