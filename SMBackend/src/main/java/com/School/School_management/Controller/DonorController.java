package com.School.School_management.Controller;

import com.School.School_management.Dto.DonorDto;
import com.School.School_management.Dto.PaginationResponse;
import com.School.School_management.Service.DonorService;
import com.School.School_management.auth.RequirePagePermission;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/donors")
public class DonorController {

    private final DonorService donorService;

    public DonorController(DonorService donorService) {
        this.donorService = donorService;
    }

    @GetMapping
    @RequirePagePermission(slug = "donar", action = "view")
    public ResponseEntity<PaginationResponse<DonorDto.Response>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String donorType,
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(donorService.getAll(page, size, headOfficeId, schoolId, donorType, academicYear, search));
    }

    @PostMapping
    @RequirePagePermission(slug = "donar", action = "add")
    public ResponseEntity<DonorDto.Response> create(@RequestBody DonorDto.Request request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(donorService.create(request));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "donar", action = "edit")
    public ResponseEntity<DonorDto.Response> update(
            @PathVariable Long id,
            @RequestBody DonorDto.Request request) {
        return ResponseEntity.ok(donorService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "donar", action = "delete")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        donorService.delete(id);
        return ResponseEntity.ok("Donor deleted successfully");
    }
}
