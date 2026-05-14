package com.School.School_management.Service;

import com.School.School_management.Dto.ManageSchoolDto;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

public interface ManageSchoolService {

    ManageSchoolDto createSchool(
            ManageSchoolDto dto,
            MultipartFile adminLogo,
            MultipartFile frontendLogo
    );

    com.School.School_management.Dto.CreateSchoolWithAdminResponse createSchoolWithAdmin(
            com.School.School_management.Dto.CreateSchoolWithAdminRequest request,
            MultipartFile adminLogo,
            MultipartFile frontendLogo,
            com.School.School_management.auth.CurrentUser user
    );

    Page<ManageSchoolDto> getAllSchools(int page, int size, Long headOfficeId, Long schoolId, String search, String status);

    ManageSchoolDto getSchoolById(Long id);

    ManageSchoolDto updateSchool(
            Long id,
            ManageSchoolDto dto,
            MultipartFile adminLogo,
            MultipartFile frontendLogo
    );

    void deleteSchool(Long id);
}
