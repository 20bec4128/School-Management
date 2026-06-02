package com.School.School_management.Controller;

import com.School.School_management.Dto.SupplierDto;
import com.School.School_management.Service.SupplierService;
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
@RequestMapping("/api/suppliers")
@RequirePagePermission(slug = "supplier", action = "view")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @GetMapping
    @RequirePagePermission(slug = "supplier", action = "view")
    public Page<SupplierDto> list(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return supplierService.list(headOfficeId, schoolId, search, page, size, CurrentUserHolder.get());
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "supplier", action = "view")
    public SupplierDto getById(@PathVariable Long id) {
        return supplierService.getById(id, CurrentUserHolder.get());
    }

    @PostMapping
    @RequirePagePermission(slug = "supplier", action = "add")
    public SupplierDto create(@RequestBody SupplierDto dto) {
        return supplierService.create(dto, CurrentUserHolder.get());
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "supplier", action = "edit")
    public SupplierDto update(@PathVariable Long id, @RequestBody SupplierDto dto) {
        return supplierService.update(id, dto, CurrentUserHolder.get());
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "supplier", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        supplierService.delete(id, CurrentUserHolder.get());
        return ResponseEntity.noContent().build();
    }
}
