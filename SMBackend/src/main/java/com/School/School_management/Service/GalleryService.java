package com.School.School_management.Service;

import com.School.School_management.Dto.GalleryDto;
import java.util.List;

public interface GalleryService {
    List<GalleryDto.Response> list(Long schoolId);
    GalleryDto.Response create(GalleryDto.Request request);
    GalleryDto.Response update(Long id, GalleryDto.Request request);
    void delete(Long id);
}
