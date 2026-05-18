package com.School.School_management.Service;

import com.School.School_management.Dto.PostalReceiveDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface PostalReceiveService {
    List<PostalReceiveDto> getAllBySchool(Long schoolId);

    Page<PostalReceiveDto> pageBySchool(Long schoolId, String search, int page, int size);

    PostalReceiveDto save(PostalReceiveDto dto);
    PostalReceiveDto update(Long id, PostalReceiveDto dto);
    void delete(Long id);
}
