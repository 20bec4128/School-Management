package com.School.School_management.Controller;

import com.School.School_management.Dto.ComplainDto;
import com.School.School_management.Service.ComplainService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/complains")
public class ComplainController {

    private final ComplainService service;

    public ComplainController(ComplainService service) {
        this.service = service;
    }

    @GetMapping("/school/{schoolId}")
    public List<ComplainDto> getAllBySchool(@PathVariable Long schoolId) {
        return service.getAllBySchool(schoolId);
    }

    @PostMapping
    public ComplainDto create(@RequestBody ComplainDto dto) {
        return service.save(dto);
    }

    @PutMapping("/{id}")
    public ComplainDto update(@PathVariable Long id, @RequestBody ComplainDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
