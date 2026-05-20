package com.School.School_management.Service;

import com.School.School_management.Dto.EmailMessageDto;
import org.springframework.data.domain.Page;

import java.util.List;

public interface EmailMessageService {
    List<EmailMessageDto> list(Long headOfficeId, Long schoolId, String category);
    Page<EmailMessageDto> listPaginated(Long headOfficeId, Long schoolId, String category, int page, int size, String search);
    EmailMessageDto findById(Long id);
    EmailMessageDto create(EmailMessageDto dto);
    EmailMessageDto update(Long id, EmailMessageDto dto);
    void delete(Long id);
}
