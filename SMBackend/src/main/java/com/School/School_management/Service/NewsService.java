package com.School.School_management.Service;

import com.School.School_management.Dto.NewsDto;
import org.springframework.data.domain.Page;
import java.util.List;

public interface NewsService {
    List<NewsDto.Response> list(Long schoolId);
    Page<NewsDto.Response> page(Long schoolId, String search, Boolean isViewOnWeb, int page, int size);
    NewsDto.Response create(NewsDto.Request request);
    NewsDto.Response update(Long id, NewsDto.Request request);
    void delete(Long id);
}
