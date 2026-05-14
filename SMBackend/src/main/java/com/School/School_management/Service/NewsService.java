package com.School.School_management.Service;

import com.School.School_management.Dto.NewsDto;
import java.util.List;

public interface NewsService {
    List<NewsDto.Response> list(Long schoolId);
    NewsDto.Response create(NewsDto.Request request);
    NewsDto.Response update(Long id, NewsDto.Request request);
    void delete(Long id);
}
