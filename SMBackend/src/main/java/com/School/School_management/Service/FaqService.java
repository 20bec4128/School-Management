package com.School.School_management.Service;

import com.School.School_management.Dto.FaqDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface FaqService {
    List<FaqDto> list(Long headOfficeId, Long schoolId);
    Page<FaqDto> listPaginated(Long headOfficeId, Long schoolId, String title, String search, int page, int size);
    FaqDto create(FaqDto dto);
    FaqDto update(Long id, FaqDto dto);
    void delete(Long id);
}
