package com.School.School_management.Controller;

import com.School.School_management.Dto.VisitorPurposeDto;
import com.School.School_management.Service.VisitorPurposeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/visitor-purposes")
public class VisitorPurposeController {

    @Autowired
    private VisitorPurposeService service;

    @GetMapping("/school/{schoolId}")
    public List<VisitorPurposeDto> getAllBySchool(@PathVariable Long schoolId) {
        return service.getAllBySchool(schoolId);
    }

    @PostMapping
    public VisitorPurposeDto create(@RequestBody VisitorPurposeDto dto) {
        return service.save(dto);
    }

    @PutMapping("/{id}")
    public VisitorPurposeDto update(@PathVariable Long id, @RequestBody VisitorPurposeDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
