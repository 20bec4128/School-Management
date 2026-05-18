package com.School.School_management.Service;

import com.School.School_management.Dto.SalaryGradeDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface SalaryGradeService {
    List<SalaryGradeDto> list(Long headOfficeId, Long schoolId);
    Page<SalaryGradeDto> listPaginated(Long headOfficeId, Long schoolId, int page, int size, String search);
    SalaryGradeDto create(SalaryGradeDto dto);
    SalaryGradeDto update(Long id, SalaryGradeDto dto);
    void delete(Long id);
}
