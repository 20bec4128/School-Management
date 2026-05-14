package com.School.School_management.Service;

import com.School.School_management.Dto.DiscountDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface DiscountService {
    List<DiscountDto> list(Long schoolId);
    Page<DiscountDto> listPaginated(Long schoolId, int page, int size, String search);
    DiscountDto create(DiscountDto dto);
    DiscountDto update(Long id, DiscountDto dto);
    void delete(Long id);
}
