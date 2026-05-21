package com.School.School_management.Service;

import com.School.School_management.Dto.AboutSchoolDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface AboutSchoolService {
    List<AboutSchoolDto> list(Long headOfficeId, Long schoolId);
    Page<AboutSchoolDto> listPaginated(Long headOfficeId, Long schoolId, String search, int page, int size);
    AboutSchoolDto create(AboutSchoolDto dto);
    AboutSchoolDto update(Long id, AboutSchoolDto dto);
    void delete(Long id);
}
