package com.School.School_management.Controller;

import com.School.School_management.Dto.AdmitCardSettingDto;
import com.School.School_management.Service.AdmitCardSettingService;
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
@RequestMapping("/api/admit-card-settings")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class AdmitCardSettingController {

    private final AdmitCardSettingService admitCardSettingService;

    public AdmitCardSettingController(AdmitCardSettingService admitCardSettingService) {
        this.admitCardSettingService = admitCardSettingService;
    }

    @GetMapping
    public Page<AdmitCardSettingDto> list(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return admitCardSettingService.list(headOfficeId, schoolId, search, page, size, CurrentUserHolder.get());
    }

    @GetMapping("/{id}")
    public AdmitCardSettingDto getById(@PathVariable Long id) {
        return admitCardSettingService.getById(id, CurrentUserHolder.get());
    }

    @PostMapping
    public AdmitCardSettingDto create(@RequestBody AdmitCardSettingDto dto) {
        return admitCardSettingService.create(dto, CurrentUserHolder.get());
    }

    @PutMapping("/{id}")
    public AdmitCardSettingDto update(@PathVariable Long id, @RequestBody AdmitCardSettingDto dto) {
        return admitCardSettingService.update(id, dto, CurrentUserHolder.get());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        admitCardSettingService.delete(id, CurrentUserHolder.get());
        return ResponseEntity.noContent().build();
    }
}

