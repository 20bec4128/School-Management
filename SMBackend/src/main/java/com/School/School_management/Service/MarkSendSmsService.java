package com.School.School_management.Service;

import com.School.School_management.Dto.MarkSendSmsDto;
import com.School.School_management.auth.CurrentUser;
import org.springframework.data.domain.Page;

import java.util.List;

public interface MarkSendSmsService {
    List<MarkSendSmsDto> list(Long headOfficeId, Long schoolId, String examTerm, String receiverType, String receiver, String template, String gateway, String search, CurrentUser user);

    Page<MarkSendSmsDto> listPaginated(Long headOfficeId, Long schoolId, String examTerm, String receiverType, String receiver, String template, String gateway, String search, int page, int size, CurrentUser user);

    MarkSendSmsDto findById(Long id, CurrentUser user);
    MarkSendSmsDto create(MarkSendSmsDto dto, CurrentUser user);
    MarkSendSmsDto update(Long id, MarkSendSmsDto dto, CurrentUser user);
    void delete(Long id, CurrentUser user);
}
