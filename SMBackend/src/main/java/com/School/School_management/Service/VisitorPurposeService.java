package com.School.School_management.Service;

import com.School.School_management.Dto.VisitorPurposeDto;
import java.util.List;

public interface VisitorPurposeService {
    List<VisitorPurposeDto> getAllBySchool(Long schoolId);
    VisitorPurposeDto save(VisitorPurposeDto dto);
    VisitorPurposeDto update(Long id, VisitorPurposeDto dto);
    void delete(Long id);
}
