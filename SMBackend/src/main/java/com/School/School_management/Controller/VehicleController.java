package com.School.School_management.Controller;

import com.School.School_management.Dto.VehicleDto;
import com.School.School_management.Service.VehicleService;
import com.School.School_management.auth.RequirePagePermission;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@RequirePagePermission(slug = "vehicle", action = "view")
public class VehicleController {

    private final VehicleService service;

    public VehicleController(VehicleService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePagePermission(slug = "vehicle", action = "view")
    public ResponseEntity<List<VehicleDto>> list(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId) {
        return ResponseEntity.ok(service.list(headOfficeId, schoolId));
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "vehicle", action = "view")
    public ResponseEntity<Page<VehicleDto>> listPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(service.listPaginated(headOfficeId, schoolId, search, page, size));
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "vehicle", action = "view")
    public ResponseEntity<VehicleDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePagePermission(slug = "vehicle", action = "add")
    public ResponseEntity<VehicleDto> create(@RequestBody VehicleDto dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "vehicle", action = "edit")
    public ResponseEntity<VehicleDto> update(@PathVariable Long id, @RequestBody VehicleDto dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "vehicle", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
