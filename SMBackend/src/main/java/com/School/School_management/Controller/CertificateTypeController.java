package com.School.School_management.Controller;

import com.School.School_management.Dto.CertificateTypeDto;
import com.School.School_management.Service.CertificateTypeService;
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
@RequestMapping("/api/certificate-types")
@RequirePagePermission(slug = "certificate-type", action = "view")
public class CertificateTypeController {

    private final CertificateTypeService certificateTypeService;

    public CertificateTypeController(CertificateTypeService certificateTypeService) {
        this.certificateTypeService = certificateTypeService;
    }

    @GetMapping
    public Page<CertificateTypeDto> list(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return certificateTypeService.list(headOfficeId, schoolId, search, page, size, CurrentUserHolder.get());
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "certificate-type", action = "view")
    public CertificateTypeDto getById(@PathVariable Long id) {
        return certificateTypeService.getById(id, CurrentUserHolder.get());
    }

    @PostMapping
    @RequirePagePermission(slug = "certificate-type", action = "add")
    public CertificateTypeDto create(@RequestBody CertificateTypeDto dto) {
        return certificateTypeService.create(dto, CurrentUserHolder.get());
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "certificate-type", action = "edit")
    public CertificateTypeDto update(@PathVariable Long id, @RequestBody CertificateTypeDto dto) {
        return certificateTypeService.update(id, dto, CurrentUserHolder.get());
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "certificate-type", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        certificateTypeService.delete(id, CurrentUserHolder.get());
        return ResponseEntity.noContent().build();
    }
}
