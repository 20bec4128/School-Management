package com.School.School_management.Controller;

import com.School.School_management.Dto.GeneralSettingDto;
import com.School.School_management.Service.GeneralSettingService;
import com.School.School_management.auth.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/general-settings")
@RequirePagePermission(slug = "general-settings", action = "view")
@CrossOrigin(
        originPatterns = {
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://school.infitoolz.com",
                "http://school.infitoolz.com"
        },
        allowCredentials = "true"
)
public class GeneralSettingController {

    @Autowired
    private GeneralSettingService service;

    @GetMapping
    @RequirePagePermission(slug = "general-settings", action = "view")
    public ResponseEntity<List<GeneralSettingDto>> getGeneralSettingsList(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId) {
        return ResponseEntity.ok(service.list(headOfficeId, schoolId));
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "general-settings", action = "view")
    public ResponseEntity<Page<GeneralSettingDto>> getGeneralSettingsPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search) {
        return ResponseEntity.ok(service.listPaginated(headOfficeId, schoolId, page, size, search));
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "general-settings", action = "view")
    public ResponseEntity<GeneralSettingDto> getGeneralSettingById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/school/{schoolId}")
    @RequirePagePermission(slug = "general-settings", action = "view")
    public ResponseEntity<GeneralSettingDto> getGeneralSettingBySchoolId(@PathVariable Long schoolId) {
        try {
            return ResponseEntity.ok(service.findBySchoolId(schoolId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    @PostMapping
    @RequirePagePermission(slug = "general-settings", action = "add")
    public ResponseEntity<GeneralSettingDto> createGeneralSetting(@RequestBody GeneralSettingDto dto) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PostMapping("/save")
    @RequirePagePermission(slug = "general-settings", action = "edit")
    public ResponseEntity<GeneralSettingDto> saveOrUpdateGeneralSetting(@RequestBody GeneralSettingDto dto) {
        return ResponseEntity.ok(service.saveOrUpdate(dto));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "general-settings", action = "edit")
    public ResponseEntity<GeneralSettingDto> updateGeneralSetting(@PathVariable Long id, @RequestBody GeneralSettingDto dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "general-settings", action = "delete")
    public ResponseEntity<Void> deleteGeneralSetting(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
