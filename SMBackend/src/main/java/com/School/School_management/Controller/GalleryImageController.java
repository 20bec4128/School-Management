package com.School.School_management.Controller;

import com.School.School_management.Dto.GalleryImageDto;
import com.School.School_management.Service.GalleryImageService;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/gallery-images")
public class GalleryImageController {

    private final GalleryImageService galleryImageService;

    public GalleryImageController(GalleryImageService galleryImageService) {
        this.galleryImageService = galleryImageService;
    }

    @GetMapping
    public ResponseEntity<List<GalleryImageDto.Response>> list(
            @RequestParam(value = "schoolId", required = false) Long schoolId,
            @RequestParam(value = "galleryId", required = false) Long galleryId
    ) {
        return ResponseEntity.ok(galleryImageService.list(schoolId, galleryId));
    }

    @GetMapping("/page")
    public ResponseEntity<Page<GalleryImageDto.Response>> page(
            @RequestParam Long schoolId,
            @RequestParam(value = "galleryId", required = false) Long galleryId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(galleryImageService.page(schoolId, galleryId, search, page, size));
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<GalleryImageDto.Response> create(
            @RequestPart("data") GalleryImageDto.Request request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        return ResponseEntity.ok(galleryImageService.create(request, file));
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public ResponseEntity<GalleryImageDto.Response> update(
            @PathVariable Long id,
            @RequestPart("data") GalleryImageDto.Request request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        return ResponseEntity.ok(galleryImageService.update(id, request, file));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        galleryImageService.delete(id);
        return ResponseEntity.ok("Deleted successfully");
    }
}
