package com.School.School_management.Service;

import com.School.School_management.Dto.SchoolSubscriptionDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface SchoolSubscriptionService {
    List<SchoolSubscriptionDto> list(Long headOfficeId, Long schoolId);
    Page<SchoolSubscriptionDto> listPaginated(Long headOfficeId, Long schoolId, String status, String search, int page, int size);
    SchoolSubscriptionDto create(SchoolSubscriptionDto dto);
    SchoolSubscriptionDto update(Long id, SchoolSubscriptionDto dto);
    void delete(Long id);
}
