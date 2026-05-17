package com.School.School_management.Service;

import com.School.School_management.Dto.CreateHeadOfficeWithAdminRequest;
import com.School.School_management.Dto.CreateHeadOfficeWithAdminResponse;
import com.School.School_management.Dto.HeadOfficeDto;
import com.School.School_management.Dto.HeadOfficeAdminCredentialsRequest;
import com.School.School_management.Dto.HeadOfficeAdminInfoResponse;
import com.School.School_management.auth.CurrentUser;
import org.springframework.data.domain.Page;

public interface HeadOfficeService {
    CreateHeadOfficeWithAdminResponse createWithAdmin(CreateHeadOfficeWithAdminRequest request, CurrentUser user);

    Page<HeadOfficeDto> getAll(int page, int size, String search, String status, CurrentUser user);

    HeadOfficeDto getById(Long id, CurrentUser user);

    HeadOfficeDto deactivate(Long id, CurrentUser user);

    HeadOfficeDto activate(Long id, CurrentUser user);

    HeadOfficeDto update(Long id, HeadOfficeDto dto, CurrentUser user);

    HeadOfficeAdminInfoResponse getAdminInfo(Long headOfficeId, CurrentUser user);

    HeadOfficeAdminInfoResponse updateAdminCredentials(Long headOfficeId, HeadOfficeAdminCredentialsRequest request, CurrentUser user);

    void delete(Long id, CurrentUser user);
}
