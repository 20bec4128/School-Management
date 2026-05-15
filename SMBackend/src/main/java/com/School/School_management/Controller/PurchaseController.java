package com.School.School_management.Controller;

import com.School.School_management.Dto.PurchaseDto;
import com.School.School_management.Service.PurchaseService;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.auth.RequirePermission;
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
@RequestMapping("/api/purchases")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class PurchaseController {

    private final PurchaseService purchaseService;

    public PurchaseController(PurchaseService purchaseService) {
        this.purchaseService = purchaseService;
    }

    @GetMapping
    public Page<PurchaseDto> list(
            @RequestParam(name = "headOfficeId", required = false) Long headOfficeId,
            @RequestParam(name = "schoolId", required = false) Long schoolId,
            @RequestParam(name = "supplierId", required = false) Long supplierId,
            @RequestParam(name = "categoryId", required = false) Long categoryId,
            @RequestParam(name = "productId", required = false) Long productId,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        return purchaseService.list(headOfficeId, schoolId, supplierId, categoryId, productId, search, page, size, CurrentUserHolder.get());
    }

    @GetMapping("/{id}")
    public PurchaseDto getById(@PathVariable("id") Long id) {
        return purchaseService.getById(id, CurrentUserHolder.get());
    }

    @PostMapping
    public PurchaseDto create(@RequestBody PurchaseDto dto) {
        return purchaseService.create(dto, CurrentUserHolder.get());
    }

    @PutMapping("/{id}")
    public PurchaseDto update(@PathVariable("id") Long id, @RequestBody PurchaseDto dto) {
        return purchaseService.update(id, dto, CurrentUserHolder.get());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        purchaseService.delete(id, CurrentUserHolder.get());
        return ResponseEntity.noContent().build();
    }
}
