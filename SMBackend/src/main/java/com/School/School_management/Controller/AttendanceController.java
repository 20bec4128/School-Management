package com.School.School_management.Controller;

import com.School.School_management.Dto.AttendanceDto;
import com.School.School_management.Service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public ResponseEntity<List<AttendanceDto>> getAttendanceList(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String examTerm,
            @RequestParam(required = false) String className,
            @RequestParam(required = false) String sectionName,
            @RequestParam(required = false) String subjectName,
            @RequestParam(defaultValue = "") String search) {
        return ResponseEntity.ok(attendanceService.list(headOfficeId, schoolId, examTerm, className, sectionName, subjectName, search));
    }

    @GetMapping("/page")
    public ResponseEntity<Page<AttendanceDto>> getAttendancePaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String examTerm,
            @RequestParam(required = false) String className,
            @RequestParam(required = false) String sectionName,
            @RequestParam(required = false) String subjectName,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(attendanceService.listPaginated(headOfficeId, schoolId, examTerm, className, sectionName, subjectName, search, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AttendanceDto> getAttendanceById(@PathVariable Long id) {
        return ResponseEntity.ok(attendanceService.getById(id));
    }

    @PostMapping
    public ResponseEntity<AttendanceDto> createAttendance(@RequestBody AttendanceDto dto) {
        return new ResponseEntity<>(attendanceService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AttendanceDto> updateAttendance(@PathVariable Long id, @RequestBody AttendanceDto dto) {
        return ResponseEntity.ok(attendanceService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttendance(@PathVariable Long id) {
        attendanceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
