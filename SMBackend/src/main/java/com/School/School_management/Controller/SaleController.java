package com.School.School_management.Controller;

import com.School.School_management.Dto.SaleDto;
import com.School.School_management.Service.SaleService;
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
@RequestMapping("/api/sales")
@RequirePagePermission(slug = "sale", action = "view")
public class SaleController {

    private final SaleService saleService;

    public SaleController(SaleService saleService) {
        this.saleService = saleService;
    }

    @GetMapping
    @RequirePagePermission(slug = "sale", action = "view")
    public Page<SaleDto> list(
            @RequestParam(name = "headOfficeId", required = false) Long headOfficeId,
            @RequestParam(name = "schoolId", required = false) Long schoolId,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        return saleService.list(headOfficeId, schoolId, status, search, page, size, CurrentUserHolder.get());
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "sale", action = "view")
    public SaleDto getById(@PathVariable("id") Long id) {
        return saleService.getById(id, CurrentUserHolder.get());
    }

    @PostMapping
    @RequirePagePermission(slug = "sale", action = "add")
    public SaleDto create(@RequestBody SaleDto dto) {
        return saleService.create(dto, CurrentUserHolder.get());
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "sale", action = "edit")
    public SaleDto update(@PathVariable("id") Long id, @RequestBody SaleDto dto) {
        return saleService.update(id, dto, CurrentUserHolder.get());
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "sale", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        saleService.delete(id, CurrentUserHolder.get());
        return ResponseEntity.noContent().build();
    }
}
