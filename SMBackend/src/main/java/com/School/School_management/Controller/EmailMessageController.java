package com.School.School_management.Controller;

import com.School.School_management.Dto.EmailMessageDto;
import com.School.School_management.Service.EmailMessageService;
import com.School.School_management.auth.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emails")
@CrossOrigin(
        originPatterns = {
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://school.infitoolz.com",
                "http://school.infitoolz.com"
        },
        allowCredentials = "true"
)
public class EmailMessageController {

    @Autowired
    private EmailMessageService service;

    @GetMapping
    @RequirePagePermission(slug = "absent-email", action = "view")
    public ResponseEntity<List<EmailMessageDto>> getEmails(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(service.list(headOfficeId, schoolId, category));
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "absent-email", action = "view")
    public ResponseEntity<Page<EmailMessageDto>> getEmailsPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search) {
        return ResponseEntity.ok(service.listPaginated(headOfficeId, schoolId, category, page, size, search));
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "absent-email", action = "view")
    public ResponseEntity<EmailMessageDto> getEmailById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @RequirePagePermission(slug = "absent-email", action = "add")
    public ResponseEntity<EmailMessageDto> sendEmail(@RequestBody EmailMessageDto dto) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "absent-email", action = "edit")
    public ResponseEntity<EmailMessageDto> updateEmail(@PathVariable Long id, @RequestBody EmailMessageDto dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "absent-email", action = "delete")
    public ResponseEntity<Void> deleteEmail(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
