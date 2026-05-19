package com.School.School_management.Service;

import com.School.School_management.Dto.SubscriptionPlanDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface SubscriptionPlanService {
    List<SubscriptionPlanDto> list();
    Page<SubscriptionPlanDto> listPaginated(String status, String search, int page, int size);
    SubscriptionPlanDto create(SubscriptionPlanDto dto);
    SubscriptionPlanDto update(Long id, SubscriptionPlanDto dto);
    void delete(Long id);
}
