package com.School.School_management.Controller;

import com.School.School_management.Dto.CreateHeadOfficeWithAdminRequest;
import com.School.School_management.Dto.CreateHeadOfficeWithAdminResponse;
import com.School.School_management.Dto.HeadOfficeDto;
import com.School.School_management.Dto.HeadOfficeAdminCredentialsRequest;
import com.School.School_management.Dto.HeadOfficeAdminInfoResponse;
import com.School.School_management.Service.HeadOfficeService;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.auth.RequirePagePermission;
import com.School.School_management.auth.RequirePermission;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/head-offices")
public class HeadOfficeController {

    private final HeadOfficeService headOfficeService;

    public HeadOfficeController(HeadOfficeService headOfficeService) {
        this.headOfficeService = headOfficeService;
    }

    @RequirePermission({"HEAD_OFFICE_MANAGE", "*"})
    @PostMapping("/create-with-admin")
    public CreateHeadOfficeWithAdminResponse createWithAdmin(@RequestBody CreateHeadOfficeWithAdminRequest request) {
        return headOfficeService.createWithAdmin(request, CurrentUserHolder.get());
    }

    @RequirePagePermission(slug = "head-offices", action = "view")
    @GetMapping
    public Page<HeadOfficeDto> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status
    ) {
        return headOfficeService.getAll(page, size, search, status, CurrentUserHolder.get());
    }

    @RequirePermission({"HEAD_OFFICE_MANAGE", "*"})
    @GetMapping("/{id}")
    public HeadOfficeDto getById(@PathVariable Long id) {
        return headOfficeService.getById(id, CurrentUserHolder.get());
    }

    @RequirePermission({"HEAD_OFFICE_MANAGE", "*"})
    @PatchMapping("/{id}/deactivate")
    public HeadOfficeDto deactivate(@PathVariable Long id) {
        return headOfficeService.deactivate(id, CurrentUserHolder.get());
    }

    @RequirePermission({"HEAD_OFFICE_MANAGE", "*"})
    @PatchMapping("/{id}/activate")
    public HeadOfficeDto activate(@PathVariable Long id) {
        return headOfficeService.activate(id, CurrentUserHolder.get());
    }

    @RequirePermission({"HEAD_OFFICE_MANAGE", "*"})
    @PatchMapping("/{id}")
    public HeadOfficeDto update(@PathVariable Long id, @RequestBody HeadOfficeDto dto) {
        return headOfficeService.update(id, dto, CurrentUserHolder.get());
    }

    @RequirePermission({"HEAD_OFFICE_MANAGE", "*"})
    @GetMapping("/{id}/admin")
    public HeadOfficeAdminInfoResponse getAdmin(@PathVariable Long id) {
        return headOfficeService.getAdminInfo(id, CurrentUserHolder.get());
    }

    @RequirePermission({"HEAD_OFFICE_MANAGE", "*"})
    @PatchMapping("/{id}/admin")
    public HeadOfficeAdminInfoResponse updateAdmin(@PathVariable Long id, @RequestBody HeadOfficeAdminCredentialsRequest request) {
        return headOfficeService.updateAdminCredentials(id, request, CurrentUserHolder.get());
    }

    @RequirePermission({"HEAD_OFFICE_MANAGE", "*"})
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        headOfficeService.delete(id, CurrentUserHolder.get());
        return ResponseEntity.noContent().build();
    }
}
