package com.School.School_management.Controller;

import com.School.School_management.Dto.PostalReceiveDto;
import com.School.School_management.Service.PostalReceiveService;
import com.School.School_management.auth.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/postal-receives")
public class PostalReceiveController {

    @Autowired
    private PostalReceiveService service;

    @GetMapping("/school/{schoolId}")
    @RequirePagePermission(slug = "postal-receive", action = "view")
    public List<PostalReceiveDto> getAllBySchool(@PathVariable Long schoolId) {
        return service.getAllBySchool(schoolId);
    }

    @GetMapping
    @RequirePagePermission(slug = "postal-receive", action = "view")
    public Page<PostalReceiveDto> page(
            @RequestParam Long schoolId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.pageBySchool(schoolId, search, page, size);
    }

    @PostMapping
    @RequirePagePermission(slug = "postal-receive", action = "add")
    public PostalReceiveDto create(@RequestBody PostalReceiveDto dto) {
        return service.save(dto);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "postal-receive", action = "edit")
    public PostalReceiveDto update(@PathVariable Long id, @RequestBody PostalReceiveDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "postal-receive", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
