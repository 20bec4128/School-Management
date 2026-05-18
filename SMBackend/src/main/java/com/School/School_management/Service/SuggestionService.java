package com.School.School_management.Service;

import com.School.School_management.Dto.SuggestionDto;
import com.School.School_management.auth.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface SuggestionService {
    List<SuggestionDto> list(Long headOfficeId, Long schoolId, String examTerm, String className, String subjectName, String search, CurrentUser user);

    Page<SuggestionDto> listPaginated(Long headOfficeId, Long schoolId, String examTerm, String className, String subjectName, String search, int page, int size, CurrentUser user);

    SuggestionDto getById(Long id, CurrentUser user);

    SuggestionDto create(SuggestionDto dto, MultipartFile document, CurrentUser user);

    SuggestionDto update(Long id, SuggestionDto dto, MultipartFile document, CurrentUser user);

    void delete(Long id, CurrentUser user);
}
