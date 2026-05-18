package com.School.School_management.Service;

import com.School.School_management.Dto.GalleryDto;
import org.springframework.data.domain.Page;
import java.util.List;

public interface GalleryService {
    List<GalleryDto.Response> list(Long schoolId);
    Page<GalleryDto.Response> page(Long schoolId, String search, Boolean isViewOnWeb, int page, int size);
    GalleryDto.Response create(GalleryDto.Request request);
    GalleryDto.Response update(Long id, GalleryDto.Request request);
    void delete(Long id);
}
