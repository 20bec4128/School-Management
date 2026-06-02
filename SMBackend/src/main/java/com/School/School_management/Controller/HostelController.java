package com.School.School_management.Controller;

import com.School.School_management.Dto.HostelDto;
import com.School.School_management.Service.HostelService;
import com.School.School_management.auth.RequirePagePermission;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hostels")
@RequirePagePermission(slug = "manage-hostel", action = "view")
public class HostelController {

    private final HostelService service;

    public HostelController(HostelService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePagePermission(slug = "manage-hostel", action = "view")
    public ResponseEntity<List<HostelDto>> list(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId
    ) {
        return ResponseEntity.ok(service.list(headOfficeId, schoolId));
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "manage-hostel", action = "view")
    public ResponseEntity<Page<HostelDto>> listPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(service.listPaginated(headOfficeId, schoolId, search, page, size));
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "manage-hostel", action = "view")
    public ResponseEntity<HostelDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePagePermission(slug = "manage-hostel", action = "add")
    public ResponseEntity<HostelDto> create(@RequestBody HostelDto dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "manage-hostel", action = "edit")
    public ResponseEntity<HostelDto> update(@PathVariable Long id, @RequestBody HostelDto dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "manage-hostel", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
