package com.School.School_management.Controller;

import com.School.School_management.Dto.PaymentSettingDto;
import com.School.School_management.Service.PaymentSettingService;
import com.School.School_management.auth.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payment-settings")
@CrossOrigin(
        originPatterns = {
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://school.infitoolz.com",
                "http://school.infitoolz.com"
        },
        allowCredentials = "true"
)
public class PaymentSettingController {

    @Autowired
    private PaymentSettingService service;

    @GetMapping
    @RequirePagePermission(slug = "payment-setting", action = "view")
    public ResponseEntity<List<PaymentSettingDto>> getPaymentSettingsList(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId) {
        return ResponseEntity.ok(service.list(headOfficeId, schoolId));
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "payment-setting", action = "view")
    public ResponseEntity<Page<PaymentSettingDto>> getPaymentSettingsPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search) {
        return ResponseEntity.ok(service.listPaginated(headOfficeId, schoolId, page, size, search));
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "payment-setting", action = "view")
    public ResponseEntity<PaymentSettingDto> getPaymentSettingById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @RequirePagePermission(slug = "payment-setting", action = "add")
    public ResponseEntity<PaymentSettingDto> createPaymentSetting(@RequestBody PaymentSettingDto dto) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "payment-setting", action = "edit")
    public ResponseEntity<PaymentSettingDto> updatePaymentSetting(@PathVariable Long id, @RequestBody PaymentSettingDto dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "payment-setting", action = "delete")
    public ResponseEntity<Void> deletePaymentSetting(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
