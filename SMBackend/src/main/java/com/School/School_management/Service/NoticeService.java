package com.School.School_management.Service;

import com.School.School_management.Dto.NoticeDto;
import java.util.List;

public interface NoticeService {
    List<NoticeDto.Response> list(Long schoolId);
    NoticeDto.Response create(NoticeDto.Request request);
    NoticeDto.Response update(Long id, NoticeDto.Request request);
    void delete(Long id);
}
