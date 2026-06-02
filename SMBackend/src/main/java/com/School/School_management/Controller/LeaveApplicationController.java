package com.School.School_management.Controller;

import com.School.School_management.Dto.LeaveApplicationDto;
import com.School.School_management.Service.LeaveApplicationService;
import com.School.School_management.auth.RequirePagePermission;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/leave-applications")
@RequirePagePermission(slug = "leave-application", action = "view")
public class LeaveApplicationController {

    private final LeaveApplicationService leaveApplicationService;
    private final ObjectMapper objectMapper;

    public LeaveApplicationController(LeaveApplicationService leaveApplicationService, ObjectMapper objectMapper) {
        this.leaveApplicationService = leaveApplicationService;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    @RequirePagePermission(slug = "leave-application", action = "view")
    public ResponseEntity<List<LeaveApplicationDto.Response>> list(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(leaveApplicationService.list(schoolId, status));
    }

    @GetMapping("/coverage")
    @RequirePagePermission(slug = "leave-application", action = "view")
    public ResponseEntity<List<LeaveApplicationDto.Response>> coverage(
            @RequestParam Long schoolId,
            @RequestParam String applicantType,
            @RequestParam LocalDate date,
            @RequestParam String applicantIds
    ) {
        List<Long> ids = Arrays.stream(String.valueOf(applicantIds).split(","))
                .map(String::trim)
                .filter((s) -> !s.isEmpty())
                .map((s) -> {
                    try {
                        return Long.parseLong(s);
                    } catch (NumberFormatException ex) {
                        return null;
                    }
                })
                .filter((v) -> v != null)
                .distinct()
                .collect(Collectors.toList());

        return ResponseEntity.ok(leaveApplicationService.coverage(schoolId, applicantType, date, ids));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequirePagePermission(slug = "leave-application", action = "add")
    public ResponseEntity<LeaveApplicationDto.Response> create(
            @RequestPart("data") String data,
            @RequestPart(value = "attachment", required = false) MultipartFile attachment
    ) throws Exception {
        LeaveApplicationDto.Request request = objectMapper.readValue(data, LeaveApplicationDto.Request.class);
        return ResponseEntity.ok(leaveApplicationService.create(request, attachment));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequirePagePermission(slug = "leave-application", action = "edit")
    public ResponseEntity<LeaveApplicationDto.Response> update(
            @PathVariable Long id,
            @RequestPart("data") String data,
            @RequestPart(value = "attachment", required = false) MultipartFile attachment
    ) throws Exception {
        LeaveApplicationDto.Request request = objectMapper.readValue(data, LeaveApplicationDto.Request.class);
        return ResponseEntity.ok(leaveApplicationService.update(id, request, attachment));
    }

    @PatchMapping("/{id}/status")
    @RequirePagePermission(slug = "leave-application", action = "edit")
    public ResponseEntity<LeaveApplicationDto.Response> updateStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        return ResponseEntity.ok(leaveApplicationService.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "leave-application", action = "delete")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        leaveApplicationService.delete(id);
        return ResponseEntity.ok("Leave application deleted successfully");
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "leave-application", action = "view")
    public ResponseEntity<LeaveApplicationDto.Response> getById(@PathVariable Long id) {
        return ResponseEntity.ok(leaveApplicationService.getById(id));
    }
}
