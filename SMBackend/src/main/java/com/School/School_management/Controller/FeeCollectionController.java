package com.School.School_management.Controller;

import com.School.School_management.Dto.FeeCollectionDto;
import com.School.School_management.Service.FeeCollectionService;
import org.springframework.data.domain.Page;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fee-collections")
public class FeeCollectionController {

    @Autowired
    private FeeCollectionService service;

    @PostMapping
    public ResponseEntity<FeeCollectionDto> create(@RequestBody FeeCollectionDto dto) {
        return ResponseEntity.ok(service.createFeeCollection(dto));
    }

    @GetMapping
    public ResponseEntity<List<FeeCollectionDto>> getAll() {
        return ResponseEntity.ok(service.getAllFeeCollections());
    }

    @GetMapping("/school/{schoolId}")
    public ResponseEntity<List<FeeCollectionDto>> getBySchool(@PathVariable Long schoolId) {
        return ResponseEntity.ok(service.getFeeCollectionsBySchool(schoolId));
    }

    @GetMapping("/page")
    public ResponseEntity<Page<FeeCollectionDto>> getPage(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long feeTypeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(service.getFeeCollectionsPage(schoolId, classId, feeTypeId, status, month, search, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FeeCollectionDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getFeeCollectionById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FeeCollectionDto> update(@PathVariable Long id, @RequestBody FeeCollectionDto dto) {
        return ResponseEntity.ok(service.updateFeeCollection(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteFeeCollection(id);
        return ResponseEntity.noContent().build();
    }
}
