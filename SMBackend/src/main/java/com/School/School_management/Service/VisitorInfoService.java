package com.School.School_management.Service;

import com.School.School_management.Dto.VisitorInfoDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface VisitorInfoService {
    List<VisitorInfoDto> getAllBySchool(Long schoolId);

    Page<VisitorInfoDto> pageBySchool(Long schoolId, String search, int page, int size);

    VisitorInfoDto save(VisitorInfoDto dto);
    VisitorInfoDto update(Long id, VisitorInfoDto dto);
    void delete(Long id);
}
