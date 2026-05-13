package com.School.School_management.Service;

import com.School.School_management.Dto.EmployeeDto;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface EmployeeService {
    List<EmployeeDto> list(Long schoolId);
    EmployeeDto create(EmployeeDto dto, MultipartFile photo, MultipartFile resume);
    EmployeeDto update(Long id, EmployeeDto dto, MultipartFile photo, MultipartFile resume);
    void delete(Long id);
}
