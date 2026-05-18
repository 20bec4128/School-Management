package com.School.School_management.Service;

import com.School.School_management.Dto.MarkSendEmailDto;
import org.springframework.data.domain.Page;
import java.util.List;

public interface MarkSendEmailService {
    List<MarkSendEmailDto> list(Long headOfficeId, Long schoolId);
    Page<MarkSendEmailDto> listPaginated(Long headOfficeId, Long schoolId, int page, int size, String search);
    MarkSendEmailDto findById(Long id);
    MarkSendEmailDto create(MarkSendEmailDto dto);
    MarkSendEmailDto update(Long id, MarkSendEmailDto dto);
    void delete(Long id);
}