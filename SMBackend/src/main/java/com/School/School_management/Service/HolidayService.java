package com.School.School_management.Service;

import com.School.School_management.Dto.HolidayDto;
import java.util.List;

public interface HolidayService {
    List<HolidayDto.Response> list(Long schoolId);
    HolidayDto.Response create(HolidayDto.Request request);
    HolidayDto.Response update(Long id, HolidayDto.Request request);
    void delete(Long id);
}
