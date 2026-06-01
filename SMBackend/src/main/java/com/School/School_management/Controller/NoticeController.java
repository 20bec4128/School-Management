package com.School.School_management.Controller;

import com.School.School_management.Dto.NoticeDto;
import com.School.School_management.Service.NoticeService;
import com.School.School_management.auth.RequirePagePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/notices")
public class NoticeController {

    private final NoticeService noticeService;

    public NoticeController(NoticeService noticeService) {
        this.noticeService = noticeService;
    }

    @GetMapping
    @RequirePagePermission(slug = "notice", action = "view")
    public ResponseEntity<List<NoticeDto.Response>> list(@RequestParam(required = false) Long schoolId) {
        return ResponseEntity.ok(noticeService.list(schoolId));
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "notice", action = "view")
    public ResponseEntity<Page<NoticeDto.Response>> page(
            @RequestParam Long schoolId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String noticeFor,
            @RequestParam(required = false) Boolean isViewOnWeb,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(noticeService.page(schoolId, search, noticeFor, isViewOnWeb, page, size));
    }

    @PostMapping
    @RequirePagePermission(slug = "notice", action = "add")
    public ResponseEntity<NoticeDto.Response> create(@RequestBody NoticeDto.Request request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(noticeService.create(request));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "notice", action = "edit")
    public ResponseEntity<NoticeDto.Response> update(@PathVariable Long id, @RequestBody NoticeDto.Request request) {
        return ResponseEntity.ok(noticeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "notice", action = "delete")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        noticeService.delete(id);
        return ResponseEntity.ok("Notice deleted successfully");
    }
}
