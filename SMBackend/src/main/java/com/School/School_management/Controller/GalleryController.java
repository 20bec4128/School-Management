package com.School.School_management.Controller;

import com.School.School_management.Dto.GalleryDto;
import com.School.School_management.Service.GalleryService;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/galleries")
public class GalleryController {

    private final GalleryService galleryService;

    public GalleryController(GalleryService galleryService) {
        this.galleryService = galleryService;
    }

    @GetMapping
    public ResponseEntity<List<GalleryDto.Response>> list(@RequestParam(value = "schoolId", required = false) Long schoolId) {
        return ResponseEntity.ok(galleryService.list(schoolId));
    }

    @GetMapping("/page")
    public ResponseEntity<Page<GalleryDto.Response>> page(
            @RequestParam Long schoolId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isViewOnWeb,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(galleryService.page(schoolId, search, isViewOnWeb, page, size));
    }

    @PostMapping
    public ResponseEntity<GalleryDto.Response> create(@RequestBody GalleryDto.Request request) {
        return ResponseEntity.ok(galleryService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GalleryDto.Response> update(@PathVariable Long id, @RequestBody GalleryDto.Request request) {
        return ResponseEntity.ok(galleryService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        galleryService.delete(id);
        return ResponseEntity.ok("Deleted successfully");
    }
}
