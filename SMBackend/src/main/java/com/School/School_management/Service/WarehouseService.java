package com.School.School_management.Service;

import com.School.School_management.Dto.WarehouseDto;
import com.School.School_management.auth.CurrentUser;
import org.springframework.data.domain.Page;

public interface WarehouseService {
    Page<WarehouseDto> list(Long headOfficeId, Long schoolId, String search, int page, int size, CurrentUser user);

    WarehouseDto getById(Long id, CurrentUser user);

    WarehouseDto create(WarehouseDto dto, CurrentUser user);

    WarehouseDto update(Long id, WarehouseDto dto, CurrentUser user);

    void delete(Long id, CurrentUser user);
}
