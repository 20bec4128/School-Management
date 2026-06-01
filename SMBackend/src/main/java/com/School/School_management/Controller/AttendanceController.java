package com.School.School_management.Controller;

import com.School.School_management.Dto.AttendanceDto;
import com.School.School_management.Service.AttendanceService;
import com.School.School_management.auth.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/attendances")
@CrossOrigin(
        originPatterns = {
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://school.infitoolz.com",
                "http://school.infitoolz.com"
        },
        allowCredentials = "true"
)
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @GetMapping
    @RequirePagePermission(slug = "attendance", action = "view")
    public ResponseEntity<List<AttendanceDto>> getAttendanceList(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String examTerm,
            @RequestParam(required = false) String className,
            @RequestParam(required = false) String sectionName,
            @RequestParam(required = false) String subjectName,
            @RequestParam(required = false) LocalDate attendanceDate,
            @RequestParam(defaultValue = "") String search) {
        return ResponseEntity.ok(attendanceService.list(headOfficeId, schoolId, examTerm, className, sectionName, subjectName, attendanceDate, search));
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "attendance", action = "view")
    public ResponseEntity<Page<AttendanceDto>> getAttendancePaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String examTerm,
            @RequestParam(required = false) String className,
            @RequestParam(required = false) String sectionName,
            @RequestParam(required = false) String subjectName,
            @RequestParam(required = false) LocalDate attendanceDate,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(attendanceService.listPaginated(headOfficeId, schoolId, examTerm, className, sectionName, subjectName, attendanceDate, search, page, size));
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "attendance", action = "view")
    public ResponseEntity<AttendanceDto> getAttendanceById(@PathVariable Long id) {
        return ResponseEntity.ok(attendanceService.getById(id));
    }

    @PostMapping
    @RequirePagePermission(slug = "attendance", action = "add")
    public ResponseEntity<AttendanceDto> createAttendance(@RequestBody AttendanceDto dto) {
        return new ResponseEntity<>(attendanceService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "attendance", action = "edit")
    public ResponseEntity<AttendanceDto> updateAttendance(@PathVariable Long id, @RequestBody AttendanceDto dto) {
        return ResponseEntity.ok(attendanceService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "attendance", action = "delete")
    public ResponseEntity<Void> deleteAttendance(@PathVariable Long id) {
        attendanceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
