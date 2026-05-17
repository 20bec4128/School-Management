package com.School.School_management.Service;

import com.School.School_management.Dto.NoticeDto;
import org.springframework.data.domain.Page;
import java.util.List;

public interface NoticeService {
    List<NoticeDto.Response> list(Long schoolId);
    Page<NoticeDto.Response> page(Long schoolId, String search, String noticeFor, Boolean isViewOnWeb, int page, int size);
    NoticeDto.Response create(NoticeDto.Request request);
    NoticeDto.Response update(Long id, NoticeDto.Request request);
    void delete(Long id);
}
