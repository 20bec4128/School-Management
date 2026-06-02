package com.School.School_management.Controller;

import com.School.School_management.Dto.TransportRouteDto;
import com.School.School_management.Service.TransportRouteService;
import com.School.School_management.auth.RequirePagePermission;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transport-routes")
@RequirePagePermission(slug = "transport-route", action = "view")
public class TransportRouteController {

    private final TransportRouteService service;

    public TransportRouteController(TransportRouteService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePagePermission(slug = "transport-route", action = "view")
    public ResponseEntity<List<TransportRouteDto>> list(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId
    ) {
        return ResponseEntity.ok(service.list(headOfficeId, schoolId));
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "transport-route", action = "view")
    public ResponseEntity<Page<TransportRouteDto>> listPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(service.listPaginated(headOfficeId, schoolId, search, page, size));
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "transport-route", action = "view")
    public ResponseEntity<TransportRouteDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePagePermission(slug = "transport-route", action = "add")
    public ResponseEntity<TransportRouteDto> create(@RequestBody TransportRouteDto dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "transport-route", action = "edit")
    public ResponseEntity<TransportRouteDto> update(@PathVariable Long id, @RequestBody TransportRouteDto dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "transport-route", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
