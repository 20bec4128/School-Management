package com.School.School_management.Service;

import com.School.School_management.Dto.ScheduleDto;
import org.springframework.data.domain.Page;
import java.util.List;

public interface ScheduleService {
    List<ScheduleDto> list(Long schoolId);
    Page<ScheduleDto> listPaginated(Long schoolId, int page, int size, String search);
    ScheduleDto create(ScheduleDto dto);
    ScheduleDto update(Long id, ScheduleDto dto);
    void delete(Long id);
    ScheduleDto findById(Long id);
}