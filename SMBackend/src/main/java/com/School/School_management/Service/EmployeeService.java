package com.School.School_management.Service;

import com.School.School_management.Dto.EmployeeDto;
import org.springframework.data.domain.Page;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface EmployeeService {
    List<EmployeeDto> list(Long schoolId);
    Page<EmployeeDto> listPaginated(Long schoolId, int page, int size, String search);
    EmployeeDto create(EmployeeDto dto, MultipartFile photo, MultipartFile resume);
    EmployeeDto update(Long id, EmployeeDto dto, MultipartFile photo, MultipartFile resume);
    void delete(Long id);
}
