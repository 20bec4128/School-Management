package com.School.School_management.Service;

import com.School.School_management.Dto.DepartmentDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface DepartmentService {
    Page<DepartmentDto> getAll(int page, int size);
    Page<DepartmentDto> getAll(int page, int size, Long schoolId);
    List<DepartmentDto> getAll();
    List<DepartmentDto> getAll(Long schoolId);
    DepartmentDto create(DepartmentDto dto);
    DepartmentDto update(Long id, DepartmentDto dto);
    void delete(Long id);
}
