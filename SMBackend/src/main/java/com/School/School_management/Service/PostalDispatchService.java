package com.School.School_management.Service;

import com.School.School_management.Dto.PostalDispatchDto;
import java.util.List;

public interface PostalDispatchService {
    List<PostalDispatchDto> getAllBySchool(Long schoolId);
    PostalDispatchDto save(PostalDispatchDto dto);
    PostalDispatchDto update(Long id, PostalDispatchDto dto);
    void delete(Long id);
}
