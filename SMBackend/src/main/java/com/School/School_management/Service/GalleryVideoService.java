package com.School.School_management.Service;

import com.School.School_management.Dto.GalleryVideoDto;
import org.springframework.data.domain.Page;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface GalleryVideoService {
    List<GalleryVideoDto.Response> list(Long schoolId, Long galleryId);
    Page<GalleryVideoDto.Response> page(Long schoolId, Long galleryId, String search, int page, int size);
    GalleryVideoDto.Response create(GalleryVideoDto.Request request, MultipartFile file);
    GalleryVideoDto.Response update(Long id, GalleryVideoDto.Request request, MultipartFile file);
    void delete(Long id);
}
