package com.School.School_management.Service;

import com.School.School_management.Dto.LibraryIssueDto;
import com.School.School_management.auth.CurrentUser;
import org.springframework.data.domain.Page;

public interface LibraryIssueService {
    Page<LibraryIssueDto> list(Long headOfficeId, Long schoolId, String status, String search, int page, int size, CurrentUser user);
    LibraryIssueDto getById(Long id, CurrentUser user);
    LibraryIssueDto create(LibraryIssueDto dto, CurrentUser user);
    LibraryIssueDto update(Long id, LibraryIssueDto dto, CurrentUser user);
    void delete(Long id, CurrentUser user);
}
