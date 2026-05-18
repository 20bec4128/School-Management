package com.School.School_management.Controller;

import com.School.School_management.Dto.MarkSendEmailDto;
import com.School.School_management.Service.MarkSendEmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mark-send-emails")
@CrossOrigin(
        originPatterns = {
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://school.infitoolz.com",
                "http://school.infitoolz.com"
        },
        allowCredentials = "true"
)
public class MarkSendEmailController {

    @Autowired
    private MarkSendEmailService service;

    @GetMapping
    public ResponseEntity<List<MarkSendEmailDto>> getEmails(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId) {
        return ResponseEntity.ok(service.list(headOfficeId, schoolId));
    }

    @GetMapping("/page")
    public ResponseEntity<Page<MarkSendEmailDto>> getEmailsPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search) {
        return ResponseEntity.ok(service.listPaginated(headOfficeId, schoolId, page, size, search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MarkSendEmailDto> getEmailById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<MarkSendEmailDto> sendEmail(@RequestBody MarkSendEmailDto dto) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MarkSendEmailDto> updateEmailHistory(@PathVariable Long id, @RequestBody MarkSendEmailDto dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmailHistory(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
