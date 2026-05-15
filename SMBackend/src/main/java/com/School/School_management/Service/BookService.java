package com.School.School_management.Service;

import com.School.School_management.Dto.BookDto;
import com.School.School_management.auth.CurrentUser;
import org.springframework.data.domain.Page;

public interface BookService {
    Page<BookDto> list(Long headOfficeId, Long schoolId, String language, String edition, String almiraNo, String search, int page, int size, CurrentUser user);
    BookDto create(BookDto dto, CurrentUser user);
    BookDto update(Long id, BookDto dto, CurrentUser user);
    void delete(Long id, CurrentUser user);
}
