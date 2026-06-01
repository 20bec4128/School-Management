package com.School.School_management.Controller;

import com.School.School_management.Dto.ScheduleDto;
import com.School.School_management.Service.ScheduleService;
import com.School.School_management.auth.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@CrossOrigin(
        originPatterns = {
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://school.infitoolz.com",
                "http://school.infitoolz.com"
        },
        allowCredentials = "true"
)
public class ScheduleController {

    @Autowired
    private ScheduleService scheduleService;

    @GetMapping("/school/{schoolId}")
    @RequirePagePermission(slug = "schedule", action = "view")
    public ResponseEntity<List<ScheduleDto>> getSchedulesBySchool(@PathVariable Long schoolId) {
        return ResponseEntity.ok(scheduleService.list(schoolId));
    }

    @GetMapping("/school/{schoolId}/page")
    @RequirePagePermission(slug = "schedule", action = "view")
    public ResponseEntity<Page<ScheduleDto>> getSchedulesPaginated(
            @PathVariable Long schoolId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search) {
        return ResponseEntity.ok(scheduleService.listPaginated(schoolId, page, size, search));
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "schedule", action = "view")
    public ResponseEntity<ScheduleDto> getScheduleById(@PathVariable Long id) {
        return ResponseEntity.ok(scheduleService.findById(id));
    }

    @PostMapping
    @RequirePagePermission(slug = "schedule", action = "add")
    public ResponseEntity<ScheduleDto> createSchedule(@RequestBody ScheduleDto dto) {
        return new ResponseEntity<>(scheduleService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "schedule", action = "edit")
    public ResponseEntity<ScheduleDto> updateSchedule(@PathVariable Long id, @RequestBody ScheduleDto dto) {
        return ResponseEntity.ok(scheduleService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "schedule", action = "delete")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id) {
        scheduleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
