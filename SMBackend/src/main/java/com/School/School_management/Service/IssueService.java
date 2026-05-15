package com.School.School_management.Service;

import com.School.School_management.Dto.IssueDto;
import com.School.School_management.Dto.IssueRecipientDto;
import com.School.School_management.auth.CurrentUser;
import org.springframework.data.domain.Page;

import java.util.List;

public interface IssueService {
    Page<IssueDto> list(Long headOfficeId, Long schoolId, String userType, String search, int page, int size, CurrentUser user);
    IssueDto getById(Long id, CurrentUser user);
    IssueDto create(IssueDto dto, CurrentUser user);
    IssueDto update(Long id, IssueDto dto, CurrentUser user);
    void delete(Long id, CurrentUser user);
    List<String> roles(Long schoolId, CurrentUser user);
    List<IssueRecipientDto> recipients(Long schoolId, String role, CurrentUser user);
}
