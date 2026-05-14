package com.School.School_management.Service;

import com.School.School_management.Dto.PostalReceiveDto;
import java.util.List;

public interface PostalReceiveService {
    List<PostalReceiveDto> getAllBySchool(Long schoolId);
    PostalReceiveDto save(PostalReceiveDto dto);
    PostalReceiveDto update(Long id, PostalReceiveDto dto);
    void delete(Long id);
}
