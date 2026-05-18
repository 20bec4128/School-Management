package com.School.School_management.Controller;

import com.School.School_management.Dto.SuperAdminDto;
import com.School.School_management.Entity.SuperAdmin;
import com.School.School_management.Service.SuperAdminService;
import com.School.School_management.auth.RequirePermission;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/super-admins")
@RequirePermission({"*"})
public class SuperAdminController {

    private final SuperAdminService superAdminService;
    private final ObjectMapper objectMapper;

    public SuperAdminController(SuperAdminService superAdminService, ObjectMapper objectMapper) {
        this.superAdminService = superAdminService;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public Page<SuperAdmin> getSuperAdmins(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone
    ) {
        return superAdminService.getSuperAdmins(search, name, email, phone, page, size);
    }

    @GetMapping("/{id}")
    public SuperAdmin getSuperAdminById(@PathVariable Long id) {
        return superAdminService.getSuperAdminById(id);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public SuperAdmin create(
            @RequestPart("data") String data,
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @RequestPart(value = "resume", required = false) MultipartFile resume
    ) throws Exception {
        SuperAdminDto dto = objectMapper.readValue(data, SuperAdminDto.class);
        return superAdminService.createSuperAdmin(dto, photo, resume);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public SuperAdmin update(
            @PathVariable Long id,
            @RequestPart("data") String data,
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @RequestPart(value = "resume", required = false) MultipartFile resume
    ) throws Exception {
        SuperAdminDto dto = objectMapper.readValue(data, SuperAdminDto.class);
        return superAdminService.updateSuperAdmin(id, dto, photo, resume);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        superAdminService.deleteSuperAdmin(id);
        return "Super Admin deleted successfully";
    }
}
