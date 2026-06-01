package com.School.School_management.Controller;

import com.School.School_management.Dto.FeeCollectionDto;
import com.School.School_management.Service.FeeCollectionService;
import com.School.School_management.auth.RequirePagePermission;
import org.springframework.data.domain.Page;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fee-collections")
@RequirePagePermission(slug = "fee-collection", action = "view")
public class FeeCollectionController {

    @Autowired
    private FeeCollectionService service;

    @PostMapping
    @RequirePagePermission(slug = "fee-collection", action = "add")
    public ResponseEntity<FeeCollectionDto> create(@RequestBody FeeCollectionDto dto) {
        return ResponseEntity.ok(service.createFeeCollection(dto));
    }

    @GetMapping
    @RequirePagePermission(slug = "fee-collection", action = "view")
    public ResponseEntity<List<FeeCollectionDto>> getAll() {
        return ResponseEntity.ok(service.getAllFeeCollections());
    }

    @GetMapping("/school/{schoolId}")
    @RequirePagePermission(slug = "fee-collection", action = "view")
    public ResponseEntity<List<FeeCollectionDto>> getBySchool(@PathVariable Long schoolId) {
        return ResponseEntity.ok(service.getFeeCollectionsBySchool(schoolId));
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "fee-collection", action = "view")
    public ResponseEntity<Page<FeeCollectionDto>> getPage(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long feeTypeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) Boolean dueOnly,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(service.getFeeCollectionsPage(schoolId, classId, feeTypeId, status, month, dueOnly, search, page, size));
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "fee-collection", action = "view")
    public ResponseEntity<FeeCollectionDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getFeeCollectionById(id));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "fee-collection", action = "edit")
    public ResponseEntity<FeeCollectionDto> update(@PathVariable Long id, @RequestBody FeeCollectionDto dto) {
        return ResponseEntity.ok(service.updateFeeCollection(id, dto));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "fee-collection", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteFeeCollection(id);
        return ResponseEntity.noContent().build();
    }
}
