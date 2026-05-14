package com.School.School_management.Service;

import com.School.School_management.Dto.GalleryImageDto;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface GalleryImageService {
    List<GalleryImageDto.Response> list(Long schoolId, Long galleryId);
    GalleryImageDto.Response create(GalleryImageDto.Request request, MultipartFile file);
    GalleryImageDto.Response update(Long id, GalleryImageDto.Request request, MultipartFile file);
    void delete(Long id);
}
