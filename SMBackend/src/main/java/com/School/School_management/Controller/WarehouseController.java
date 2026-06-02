package com.School.School_management.Controller;

import com.School.School_management.Dto.WarehouseDto;
import com.School.School_management.Service.WarehouseService;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.auth.RequirePagePermission;
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
@RequestMapping("/api/warehouses")
@RequirePagePermission(slug = "warehouse", action = "view")
public class WarehouseController {

    private final WarehouseService warehouseService;

    public WarehouseController(WarehouseService warehouseService) {
        this.warehouseService = warehouseService;
    }

    @GetMapping
    @RequirePagePermission(slug = "warehouse", action = "view")
    public Page<WarehouseDto> list(
            @RequestParam(name = "headOfficeId", required = false) Long headOfficeId,
            @RequestParam(name = "schoolId", required = false) Long schoolId,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        return warehouseService.list(headOfficeId, schoolId, search, page, size, CurrentUserHolder.get());
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "warehouse", action = "view")
    public WarehouseDto getById(@PathVariable("id") Long id) {
        return warehouseService.getById(id, CurrentUserHolder.get());
    }

    @PostMapping
    @RequirePagePermission(slug = "warehouse", action = "add")
    public WarehouseDto create(@RequestBody WarehouseDto dto) {
        return warehouseService.create(dto, CurrentUserHolder.get());
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "warehouse", action = "edit")
    public WarehouseDto update(@PathVariable("id") Long id, @RequestBody WarehouseDto dto) {
        return warehouseService.update(id, dto, CurrentUserHolder.get());
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "warehouse", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        warehouseService.delete(id, CurrentUserHolder.get());
        return ResponseEntity.noContent().build();
    }
}
