package com.School.School_management.Controller;

import com.School.School_management.Dto.GalleryVideoDto;
import com.School.School_management.Service.GalleryVideoService;
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
@RequestMapping("/api/gallery-videos")
public class GalleryVideoController {

    private final GalleryVideoService galleryVideoService;

    public GalleryVideoController(GalleryVideoService galleryVideoService) {
        this.galleryVideoService = galleryVideoService;
    }

    @GetMapping
    public ResponseEntity<List<GalleryVideoDto.Response>> list(
            @RequestParam(value = "schoolId", required = false) Long schoolId,
            @RequestParam(value = "galleryId", required = false) Long galleryId
    ) {
        return ResponseEntity.ok(galleryVideoService.list(schoolId, galleryId));
    }

    @GetMapping("/page")
    public ResponseEntity<Page<GalleryVideoDto.Response>> page(
            @RequestParam Long schoolId,
            @RequestParam(value = "galleryId", required = false) Long galleryId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(galleryVideoService.page(schoolId, galleryId, search, page, size));
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<GalleryVideoDto.Response> create(
            @RequestPart("data") GalleryVideoDto.Request request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        return ResponseEntity.ok(galleryVideoService.create(request, file));
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public ResponseEntity<GalleryVideoDto.Response> update(
            @PathVariable Long id,
            @RequestPart("data") GalleryVideoDto.Request request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        return ResponseEntity.ok(galleryVideoService.update(id, request, file));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        galleryVideoService.delete(id);
        return ResponseEntity.ok("Deleted successfully");
    }
}
