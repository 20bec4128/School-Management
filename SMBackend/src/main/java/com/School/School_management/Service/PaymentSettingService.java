package com.School.School_management.Service;

import com.School.School_management.Dto.PaymentSettingDto;
import org.springframework.data.domain.Page;
import java.util.List;

public interface PaymentSettingService {
    List<PaymentSettingDto> list(Long headOfficeId, Long schoolId);
    Page<PaymentSettingDto> listPaginated(Long headOfficeId, Long schoolId, int page, int size, String search);
    PaymentSettingDto findById(Long id);
    PaymentSettingDto create(PaymentSettingDto dto);
    PaymentSettingDto update(Long id, PaymentSettingDto dto);
    void delete(Long id);
}
