package com.School.School_management.Service;

import com.School.School_management.Dto.PostalDispatchDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface PostalDispatchService {
    List<PostalDispatchDto> getAllBySchool(Long schoolId);

    Page<PostalDispatchDto> pageBySchool(Long schoolId, String search, int page, int size);

    PostalDispatchDto save(PostalDispatchDto dto);
    PostalDispatchDto update(Long id, PostalDispatchDto dto);
    void delete(Long id);
}
