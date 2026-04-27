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

    Page<ManageSchoolDto> getAllSchools(int page, int size);

    ManageSchoolDto getSchoolById(Long id);

    ManageSchoolDto updateSchool(
            Long id,
            ManageSchoolDto dto,
            MultipartFile adminLogo,
            MultipartFile frontendLogo
    );

    void deleteSchool(Long id);
}
