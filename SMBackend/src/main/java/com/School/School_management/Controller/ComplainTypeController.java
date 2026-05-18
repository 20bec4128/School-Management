package com.School.School_management.Controller;

import com.School.School_management.Dto.ComplainTypeDto;
import com.School.School_management.Service.ComplainTypeService;
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
@RequestMapping("/api/complain-types")
public class ComplainTypeController {

    private final ComplainTypeService service;

    public ComplainTypeController(ComplainTypeService service) {
        this.service = service;
    }

    @GetMapping("/school/{schoolId}")
    public List<ComplainTypeDto> getAllBySchool(@PathVariable Long schoolId) {
        return service.getAllBySchool(schoolId);
    }

    @GetMapping
    public Page<ComplainTypeDto> page(
            @RequestParam Long schoolId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.pageBySchool(schoolId, search, page, size);
    }

    @PostMapping
    public ComplainTypeDto create(@RequestBody ComplainTypeDto dto) {
        return service.save(dto);
    }

    @PutMapping("/{id}")
    public ComplainTypeDto update(@PathVariable Long id, @RequestBody ComplainTypeDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
