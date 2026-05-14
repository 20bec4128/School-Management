package com.School.School_management.Service;

import com.School.School_management.Dto.CallLogDto;
import java.util.List;

public interface CallLogService {
    List<CallLogDto> getAllBySchool(Long schoolId);
    CallLogDto save(CallLogDto dto);
    CallLogDto update(Long id, CallLogDto dto);
    void delete(Long id);
}
