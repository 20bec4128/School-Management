package com.School.School_management.Service;

import com.School.School_management.Dto.SupplierDto;
import com.School.School_management.auth.CurrentUser;
import org.springframework.data.domain.Page;

public interface SupplierService {
    Page<SupplierDto> list(Long headOfficeId, Long schoolId, String search, int page, int size, CurrentUser user);

    SupplierDto getById(Long id, CurrentUser user);

    SupplierDto create(SupplierDto dto, CurrentUser user);

    SupplierDto update(Long id, SupplierDto dto, CurrentUser user);

    void delete(Long id, CurrentUser user);
}
