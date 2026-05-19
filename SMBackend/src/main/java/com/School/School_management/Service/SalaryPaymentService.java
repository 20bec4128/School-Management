package com.School.School_management.Service;

import com.School.School_management.Dto.SalaryPaymentDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface SalaryPaymentService {
    List<SalaryPaymentDto> list(Long headOfficeId, Long schoolId);
    Page<SalaryPaymentDto> listPaginated(
            Long headOfficeId,
            Long schoolId,
            String month,
            String gradeName,
            String salaryType,
            String status,
            int page,
            int size,
            String search
    );
    SalaryPaymentDto create(SalaryPaymentDto dto);
    SalaryPaymentDto update(Long id, SalaryPaymentDto dto);
    void delete(Long id);
}
