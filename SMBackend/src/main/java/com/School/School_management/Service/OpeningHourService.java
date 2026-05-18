package com.School.School_management.Service;

import com.School.School_management.Dto.OpeningHourDto;
import org.springframework.data.domain.Page;

public interface OpeningHourService {
    Page<OpeningHourDto> getOpeningHours(Long schoolId, int page, int size);
    OpeningHourDto getOpeningHourById(Long id);
    OpeningHourDto createOpeningHour(OpeningHourDto dto);
    OpeningHourDto updateOpeningHour(Long id, OpeningHourDto dto);
    OpeningHourDto toggleStatus(Long id);
    void deleteOpeningHour(Long id);
}
