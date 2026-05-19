package com.School.School_management.Service;

import com.School.School_management.Dto.SliderDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface SliderService {
    List<SliderDto> list(Long headOfficeId, Long schoolId);
    Page<SliderDto> listPaginated(Long headOfficeId, Long schoolId, String status, String search, int page, int size);
    SliderDto create(SliderDto dto);
    SliderDto update(Long id, SliderDto dto);
    void delete(Long id);
}
