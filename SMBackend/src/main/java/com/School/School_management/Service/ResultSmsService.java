package com.School.School_management.Service;

import com.School.School_management.Dto.ResultSmsDto;
import org.springframework.data.domain.Page;
import java.util.List;

public interface ResultSmsService {
    List<ResultSmsDto> list(Long headOfficeId, Long schoolId);
    Page<ResultSmsDto> listPaginated(Long headOfficeId, Long schoolId, int page, int size, String search);
    ResultSmsDto findById(Long id);
    ResultSmsDto create(ResultSmsDto dto);
    ResultSmsDto update(Long id, ResultSmsDto dto);
    void delete(Long id);
}
