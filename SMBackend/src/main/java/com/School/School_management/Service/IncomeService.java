package com.School.School_management.Service;

import com.School.School_management.Dto.IncomeDto;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;

public interface IncomeService {
    List<IncomeDto> list(Long schoolId);
    Page<IncomeDto> listPaginated(
            Long schoolId,
            Long incomeHeadId,
            String incomeMethod,
            LocalDate startDate,
            LocalDate endDate,
            int page,
            int size,
            String search
    );
    IncomeDto create(IncomeDto dto);
    IncomeDto update(Long id, IncomeDto dto);
    void delete(Long id);
}
