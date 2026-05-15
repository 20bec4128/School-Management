package com.School.School_management.Service;

import com.School.School_management.Dto.CategoryDto;
import com.School.School_management.auth.CurrentUser;
import org.springframework.data.domain.Page;

public interface CategoryService {
    Page<CategoryDto> list(Long headOfficeId, Long schoolId, String search, int page, int size, CurrentUser user);

    CategoryDto getById(Long id, CurrentUser user);

    CategoryDto create(CategoryDto dto, CurrentUser user);

    CategoryDto update(Long id, CategoryDto dto, CurrentUser user);

    void delete(Long id, CurrentUser user);
}
