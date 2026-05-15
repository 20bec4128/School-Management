package com.School.School_management.Service;

import com.School.School_management.Dto.EBookDto;
import com.School.School_management.auth.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

public interface EBookService {
    Page<EBookDto> list(Long headOfficeId, Long schoolId, String ebookType, Long classId, String language, String search, int page, int size, CurrentUser user);
    EBookDto create(EBookDto dto, MultipartFile ebookFile, CurrentUser user);
    EBookDto update(Long id, EBookDto dto, MultipartFile ebookFile, CurrentUser user);
    void delete(Long id, CurrentUser user);
}
