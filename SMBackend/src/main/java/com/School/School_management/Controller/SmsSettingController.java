package com.School.School_management.Controller;

import com.School.School_management.Dto.SmsSettingDto;
import com.School.School_management.Service.SmsSettingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sms-settings")
@CrossOrigin(
        originPatterns = {
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://school.infitoolz.com",
                "http://school.infitoolz.com"
        },
        allowCredentials = "true"
)
public class SmsSettingController {

    @Autowired
    private SmsSettingService service;

    @GetMapping
    public ResponseEntity<List<SmsSettingDto>> getSmsSettingsList(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId) {
        return ResponseEntity.ok(service.list(headOfficeId, schoolId));
    }

    @GetMapping("/page")
    public ResponseEntity<Page<SmsSettingDto>> getSmsSettingsPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search) {
        return ResponseEntity.ok(service.listPaginated(headOfficeId, schoolId, page, size, search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SmsSettingDto> getSmsSettingById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<SmsSettingDto> createSmsSetting(@RequestBody SmsSettingDto dto) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SmsSettingDto> updateSmsSetting(@PathVariable Long id, @RequestBody SmsSettingDto dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSmsSetting(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
