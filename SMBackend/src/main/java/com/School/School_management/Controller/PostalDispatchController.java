package com.School.School_management.Controller;

import com.School.School_management.Dto.PostalDispatchDto;
import com.School.School_management.Service.PostalDispatchService;
import com.School.School_management.auth.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/postal-dispatches")
public class PostalDispatchController {

    @Autowired
    private PostalDispatchService service;

    @GetMapping("/school/{schoolId}")
    @RequirePagePermission(slug = "postal-dispatch", action = "view")
    public List<PostalDispatchDto> getAllBySchool(@PathVariable Long schoolId) {
        return service.getAllBySchool(schoolId);
    }

    @GetMapping
    @RequirePagePermission(slug = "postal-dispatch", action = "view")
    public Page<PostalDispatchDto> page(
            @RequestParam Long schoolId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.pageBySchool(schoolId, search, page, size);
    }

    @PostMapping
    @RequirePagePermission(slug = "postal-dispatch", action = "add")
    public PostalDispatchDto create(@RequestBody PostalDispatchDto dto) {
        return service.save(dto);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "postal-dispatch", action = "edit")
    public PostalDispatchDto update(@PathVariable Long id, @RequestBody PostalDispatchDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "postal-dispatch", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
