package com.School.School_management.Service;

import com.School.School_management.Dto.FrontendPageDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface FrontendPageService {
    List<FrontendPageDto> list(Long headOfficeId, Long schoolId);
    Page<FrontendPageDto> listPaginated(Long headOfficeId, Long schoolId, String search, int page, int size);
    FrontendPageDto create(FrontendPageDto dto);
    FrontendPageDto update(Long id, FrontendPageDto dto);
    void delete(Long id);
}
