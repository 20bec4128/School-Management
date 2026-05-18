package com.School.School_management.Controller;

import com.School.School_management.Dto.HolidayDto;
import com.School.School_management.Service.HolidayService;
import com.School.School_management.auth.RequirePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/holidays")
@RequirePermission({"ADMIN_USER_MANAGE", "SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class HolidayController {

    private final HolidayService holidayService;

    public HolidayController(HolidayService holidayService) {
        this.holidayService = holidayService;
    }

    @GetMapping
    public ResponseEntity<List<HolidayDto.Response>> list(@RequestParam(required = false) Long schoolId) {
        return ResponseEntity.ok(holidayService.list(schoolId));
    }

    @GetMapping("/page")
    public ResponseEntity<Page<HolidayDto.Response>> page(
            @RequestParam Long schoolId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isViewOnWeb,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(holidayService.page(schoolId, search, isViewOnWeb, page, size));
    }

    @PostMapping
    public ResponseEntity<HolidayDto.Response> create(@RequestBody HolidayDto.Request request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(holidayService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HolidayDto.Response> update(@PathVariable Long id, @RequestBody HolidayDto.Request request) {
        return ResponseEntity.ok(holidayService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        holidayService.delete(id);
        return ResponseEntity.ok("Holiday deleted successfully");
    }
}
