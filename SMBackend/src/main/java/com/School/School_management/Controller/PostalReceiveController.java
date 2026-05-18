package com.School.School_management.Controller;

import com.School.School_management.Dto.PostalReceiveDto;
import com.School.School_management.Service.PostalReceiveService;
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
    public List<PostalReceiveDto> getAllBySchool(@PathVariable Long schoolId) {
        return service.getAllBySchool(schoolId);
    }

    @GetMapping
    public Page<PostalReceiveDto> page(
            @RequestParam Long schoolId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.pageBySchool(schoolId, search, page, size);
    }

    @PostMapping
    public PostalReceiveDto create(@RequestBody PostalReceiveDto dto) {
        return service.save(dto);
    }

    @PutMapping("/{id}")
    public PostalReceiveDto update(@PathVariable Long id, @RequestBody PostalReceiveDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
