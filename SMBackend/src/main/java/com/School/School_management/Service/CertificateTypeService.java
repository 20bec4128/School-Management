package com.School.School_management.Service;

import com.School.School_management.Dto.CertificateTypeDto;
import com.School.School_management.auth.CurrentUser;
import org.springframework.data.domain.Page;

public interface CertificateTypeService {
    Page<CertificateTypeDto> list(Long headOfficeId, Long schoolId, String search, int page, int size, CurrentUser user);

    CertificateTypeDto getById(Long id, CurrentUser user);

    CertificateTypeDto create(CertificateTypeDto dto, CurrentUser user);

    CertificateTypeDto update(Long id, CertificateTypeDto dto, CurrentUser user);

    void delete(Long id, CurrentUser user);
}
