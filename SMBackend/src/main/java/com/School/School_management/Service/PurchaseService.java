package com.School.School_management.Service;

import com.School.School_management.Dto.PurchaseDto;
import com.School.School_management.auth.CurrentUser;
import org.springframework.data.domain.Page;

public interface PurchaseService {
    Page<PurchaseDto> list(Long headOfficeId, Long schoolId, Long supplierId, Long categoryId, Long productId, String search, int page, int size, CurrentUser user);

    PurchaseDto getById(Long id, CurrentUser user);

    PurchaseDto create(PurchaseDto dto, CurrentUser user);

    PurchaseDto update(Long id, PurchaseDto dto, CurrentUser user);

    void delete(Long id, CurrentUser user);
}
