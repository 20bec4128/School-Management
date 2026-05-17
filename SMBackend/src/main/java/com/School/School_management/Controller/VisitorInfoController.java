package com.School.School_management.Controller;

import com.School.School_management.Dto.VisitorInfoDto;
import com.School.School_management.Service.VisitorInfoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/visitor-infos")
public class VisitorInfoController {

    @Autowired
    private VisitorInfoService service;

    @GetMapping("/school/{schoolId}")
    public List<VisitorInfoDto> getAllBySchool(@PathVariable Long schoolId) {
        return service.getAllBySchool(schoolId);
    }

    @GetMapping
    public Page<VisitorInfoDto> page(
            @RequestParam Long schoolId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.pageBySchool(schoolId, search, page, size);
    }

    @PostMapping
    public VisitorInfoDto create(@RequestBody VisitorInfoDto dto) {
        return service.save(dto);
    }

    @PutMapping("/{id}")
    public VisitorInfoDto update(@PathVariable Long id, @RequestBody VisitorInfoDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
