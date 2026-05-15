package com.School.School_management.Controller;

import com.School.School_management.Dto.CategoryDto;
import com.School.School_management.Service.CategoryService;
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
@RequestMapping("/api/categories")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public Page<CategoryDto> list(
            @RequestParam(name = "headOfficeId", required = false) Long headOfficeId,
            @RequestParam(name = "schoolId", required = false) Long schoolId,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        return categoryService.list(headOfficeId, schoolId, search, page, size, CurrentUserHolder.get());
    }

    @GetMapping("/{id}")
    public CategoryDto getById(@PathVariable("id") Long id) {
        return categoryService.getById(id, CurrentUserHolder.get());
    }

    @PostMapping
    public CategoryDto create(@RequestBody CategoryDto dto) {
        return categoryService.create(dto, CurrentUserHolder.get());
    }

    @PutMapping("/{id}")
    public CategoryDto update(@PathVariable("id") Long id, @RequestBody CategoryDto dto) {
        return categoryService.update(id, dto, CurrentUserHolder.get());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        categoryService.delete(id, CurrentUserHolder.get());
        return ResponseEntity.noContent().build();
    }
}
