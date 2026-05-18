package com.School.School_management.Controller;

import com.School.School_management.Dto.MarkSendSmsDto;
import com.School.School_management.Service.MarkSendSmsService;
import com.School.School_management.auth.CurrentUserHolder;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mark-send-sms")
@CrossOrigin(
        originPatterns = {
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://school.infitoolz.com",
                "http://school.infitoolz.com"
        },
        allowCredentials = "true"
)
public class MarkSendSmsController {

    private final MarkSendSmsService service;

    public MarkSendSmsController(MarkSendSmsService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<MarkSendSmsDto>> getSmsLogs(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String examTerm,
            @RequestParam(required = false) String receiverType,
            @RequestParam(required = false) String receiver,
            @RequestParam(required = false) String template,
            @RequestParam(required = false) String gateway,
            @RequestParam(defaultValue = "") String search) {
        return ResponseEntity.ok(service.list(headOfficeId, schoolId, examTerm, receiverType, receiver, template, gateway, search, CurrentUserHolder.get()));
    }

    @GetMapping("/page")
    public ResponseEntity<Page<MarkSendSmsDto>> getSmsLogsPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String examTerm,
            @RequestParam(required = false) String receiverType,
            @RequestParam(required = false) String receiver,
            @RequestParam(required = false) String template,
            @RequestParam(required = false) String gateway,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(service.listPaginated(headOfficeId, schoolId, examTerm, receiverType, receiver, template, gateway, search, page, size, CurrentUserHolder.get()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MarkSendSmsDto> getSmsLogById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id, CurrentUserHolder.get()));
    }

    @PostMapping
    public ResponseEntity<MarkSendSmsDto> dispatchSms(@RequestBody MarkSendSmsDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto, CurrentUserHolder.get()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MarkSendSmsDto> updateSmsHistory(@PathVariable Long id, @RequestBody MarkSendSmsDto dto) {
        return ResponseEntity.ok(service.update(id, dto, CurrentUserHolder.get()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSmsHistory(@PathVariable Long id) {
        service.delete(id, CurrentUserHolder.get());
        return ResponseEntity.noContent().build();
    }
}
