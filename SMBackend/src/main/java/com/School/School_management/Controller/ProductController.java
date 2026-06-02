package com.School.School_management.Controller;

import com.School.School_management.Dto.ProductDto;
import com.School.School_management.Service.ProductService;
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
@RequestMapping("/api/products")
@RequirePagePermission(slug = "product", action = "view")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    @RequirePagePermission(slug = "product", action = "view")
    public Page<ProductDto> list(
            @RequestParam(name = "headOfficeId", required = false) Long headOfficeId,
            @RequestParam(name = "schoolId", required = false) Long schoolId,
            @RequestParam(name = "categoryId", required = false) Long categoryId,
            @RequestParam(name = "warehouseId", required = false) Long warehouseId,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        return productService.list(headOfficeId, schoolId, categoryId, warehouseId, search, page, size, CurrentUserHolder.get());
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "product", action = "view")
    public ProductDto getById(@PathVariable("id") Long id) {
        return productService.getById(id, CurrentUserHolder.get());
    }

    @PostMapping
    @RequirePagePermission(slug = "product", action = "add")
    public ProductDto create(@RequestBody ProductDto dto) {
        return productService.create(dto, CurrentUserHolder.get());
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "product", action = "edit")
    public ProductDto update(@PathVariable("id") Long id, @RequestBody ProductDto dto) {
        return productService.update(id, dto, CurrentUserHolder.get());
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "product", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        productService.delete(id, CurrentUserHolder.get());
        return ResponseEntity.noContent().build();
    }
}
