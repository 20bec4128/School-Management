package com.School.School_management.Service;

import com.School.School_management.Dto.HolidayDto;
import org.springframework.data.domain.Page;
import java.util.List;

public interface HolidayService {
    List<HolidayDto.Response> list(Long schoolId);
    Page<HolidayDto.Response> page(Long schoolId, String search, Boolean isViewOnWeb, int page, int size);
    HolidayDto.Response create(HolidayDto.Request request);
    HolidayDto.Response update(Long id, HolidayDto.Request request);
    void delete(Long id);
}
