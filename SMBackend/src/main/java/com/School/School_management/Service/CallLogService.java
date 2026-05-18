package com.School.School_management.Service;

import com.School.School_management.Dto.CallLogDto;
import org.springframework.data.domain.Page;
import java.util.List;

public interface CallLogService {
    List<CallLogDto> getAllBySchool(Long schoolId);
    Page<CallLogDto> pageBySchool(Long schoolId, String search, String callType, int page, int size);
    CallLogDto save(CallLogDto dto);
    CallLogDto update(Long id, CallLogDto dto);
    void delete(Long id);
}
