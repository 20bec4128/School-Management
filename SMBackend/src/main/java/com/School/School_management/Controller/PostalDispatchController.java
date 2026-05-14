package com.School.School_management.Controller;

import com.School.School_management.Dto.PostalDispatchDto;
import com.School.School_management.Service.PostalDispatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/postal-dispatches")
public class PostalDispatchController {

    @Autowired
    private PostalDispatchService service;

    @GetMapping("/school/{schoolId}")
    public List<PostalDispatchDto> getAllBySchool(@PathVariable Long schoolId) {
        return service.getAllBySchool(schoolId);
    }

    @PostMapping
    public PostalDispatchDto create(@RequestBody PostalDispatchDto dto) {
        return service.save(dto);
    }

    @PutMapping("/{id}")
    public PostalDispatchDto update(@PathVariable Long id, @RequestBody PostalDispatchDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
