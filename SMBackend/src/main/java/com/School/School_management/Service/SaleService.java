package com.School.School_management.Service;

import com.School.School_management.Dto.SaleDto;
import com.School.School_management.auth.CurrentUser;
import org.springframework.data.domain.Page;

public interface SaleService {
    Page<SaleDto> list(Long headOfficeId, Long schoolId, String status, String search, int page, int size, CurrentUser user);

    SaleDto getById(Long id, CurrentUser user);

    SaleDto create(SaleDto dto, CurrentUser user);

    SaleDto update(Long id, SaleDto dto, CurrentUser user);

    void delete(Long id, CurrentUser user);
}
