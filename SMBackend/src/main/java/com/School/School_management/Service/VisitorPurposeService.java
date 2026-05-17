package com.School.School_management.Service;

import com.School.School_management.Dto.VisitorPurposeDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface VisitorPurposeService {
    List<VisitorPurposeDto> getAllBySchool(Long schoolId);

    Page<VisitorPurposeDto> pageBySchool(Long schoolId, String search, int page, int size);

    VisitorPurposeDto save(VisitorPurposeDto dto);
    VisitorPurposeDto update(Long id, VisitorPurposeDto dto);
    void delete(Long id);
}
