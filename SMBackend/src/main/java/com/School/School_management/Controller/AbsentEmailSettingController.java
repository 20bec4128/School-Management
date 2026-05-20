package com.School.School_management.Controller;

import com.School.School_management.Dto.AbsentEmailSettingDto;
import com.School.School_management.Service.AbsentEmailSettingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/absent-email-settings")
@CrossOrigin(
        originPatterns = {
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://school.infitoolz.com",
                "http://school.infitoolz.com"
        },
        allowCredentials = "true"
)
public class AbsentEmailSettingController {

    @Autowired
    private AbsentEmailSettingService service;

    @GetMapping
    public ResponseEntity<List<AbsentEmailSettingDto>> list(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId
    ) {
        return ResponseEntity.ok(service.list(headOfficeId, schoolId));
    }

    @PostMapping
    public ResponseEntity<AbsentEmailSettingDto> create(@RequestBody AbsentEmailSettingDto dto) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AbsentEmailSettingDto> update(@PathVariable Long id, @RequestBody AbsentEmailSettingDto dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

