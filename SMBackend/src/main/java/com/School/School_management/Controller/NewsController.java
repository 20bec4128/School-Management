package com.School.School_management.Controller;

import com.School.School_management.Dto.NewsDto;
import com.School.School_management.Service.NewsService;
import com.School.School_management.auth.RequirePermission;
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
@RequestMapping("/api/news")
@RequirePermission({"ADMIN_USER_MANAGE", "SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class NewsController {

    private final NewsService newsService;

    public NewsController(NewsService newsService) {
        this.newsService = newsService;
    }

    @GetMapping
    public ResponseEntity<List<NewsDto.Response>> list(@RequestParam(required = false) Long schoolId) {
        return ResponseEntity.ok(newsService.list(schoolId));
    }

    @GetMapping("/page")
    public ResponseEntity<Page<NewsDto.Response>> page(
            @RequestParam Long schoolId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isViewOnWeb,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(newsService.page(schoolId, search, isViewOnWeb, page, size));
    }

    @PostMapping
    public ResponseEntity<NewsDto.Response> create(@RequestBody NewsDto.Request request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(newsService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NewsDto.Response> update(@PathVariable Long id, @RequestBody NewsDto.Request request) {
        return ResponseEntity.ok(newsService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        newsService.delete(id);
        return ResponseEntity.ok("News deleted successfully");
    }
}
