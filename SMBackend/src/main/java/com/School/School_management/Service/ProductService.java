package com.School.School_management.Service;

import com.School.School_management.Dto.ProductDto;
import com.School.School_management.auth.CurrentUser;
import org.springframework.data.domain.Page;

public interface ProductService {
    Page<ProductDto> list(Long headOfficeId, Long schoolId, Long categoryId, Long warehouseId, String search, int page, int size, CurrentUser user);

    ProductDto getById(Long id, CurrentUser user);

    ProductDto create(ProductDto dto, CurrentUser user);

    ProductDto update(Long id, ProductDto dto, CurrentUser user);

    void delete(Long id, CurrentUser user);
}
