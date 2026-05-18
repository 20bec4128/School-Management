package com.School.School_management.Service;

import com.School.School_management.Dto.ResultEmailDto;
import org.springframework.data.domain.Page;
import java.util.List;

public interface ResultEmailService {
    List<ResultEmailDto> list(Long headOfficeId, Long schoolId);
    Page<ResultEmailDto> listPaginated(Long headOfficeId, Long schoolId, int page, int size, String search);
    ResultEmailDto findById(Long id);
    ResultEmailDto create(ResultEmailDto dto);
    ResultEmailDto update(Long id, ResultEmailDto dto);
    void delete(Long id);
}
