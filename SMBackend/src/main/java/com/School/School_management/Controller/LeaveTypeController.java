package com.School.School_management.Controller;

import com.School.School_management.Dto.LeaveTypeDto;
import com.School.School_management.Service.LeaveTypeService;
import com.School.School_management.auth.RequirePagePermission;
import java.util.List;
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
@RequestMapping("/api/leave-types")
@RequirePagePermission(slug = "leave-type", action = "view")
public class LeaveTypeController {

    private final LeaveTypeService leaveTypeService;

    public LeaveTypeController(LeaveTypeService leaveTypeService) {
        this.leaveTypeService = leaveTypeService;
    }

    @GetMapping
    @RequirePagePermission(slug = "leave-type", action = "view")
    public ResponseEntity<List<LeaveTypeDto.Response>> list(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Long designationId
    ) {
        return ResponseEntity.ok(leaveTypeService.list(schoolId, role, designationId));
    }

    @PostMapping
    @RequirePagePermission(slug = "leave-type", action = "add")
    public ResponseEntity<LeaveTypeDto.Response> create(@RequestBody LeaveTypeDto.Request request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(leaveTypeService.create(request));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "leave-type", action = "edit")
    public ResponseEntity<LeaveTypeDto.Response> update(@PathVariable Long id, @RequestBody LeaveTypeDto.Request request) {
        return ResponseEntity.ok(leaveTypeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "leave-type", action = "delete")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        leaveTypeService.delete(id);
        return ResponseEntity.ok("Leave type deleted successfully");
    }
}
