package com.School.School_management.Controller;

import com.School.School_management.Dto.RoomDto;
import com.School.School_management.Service.RoomService;
import com.School.School_management.auth.RequirePagePermission;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequirePagePermission(slug = "manage-room", action = "view")
public class RoomController {

    private final RoomService service;

    public RoomController(RoomService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePagePermission(slug = "manage-room", action = "view")
    public ResponseEntity<List<RoomDto>> list(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long hostelId,
            @RequestParam(required = false) String roomType
    ) {
        return ResponseEntity.ok(service.list(headOfficeId, schoolId, hostelId, roomType));
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "manage-room", action = "view")
    public ResponseEntity<Page<RoomDto>> listPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long hostelId,
            @RequestParam(required = false) String roomType,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(service.listPaginated(headOfficeId, schoolId, hostelId, roomType, search, page, size));
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "manage-room", action = "view")
    public ResponseEntity<RoomDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePagePermission(slug = "manage-room", action = "add")
    public ResponseEntity<RoomDto> create(@RequestBody RoomDto dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "manage-room", action = "edit")
    public ResponseEntity<RoomDto> update(@PathVariable Long id, @RequestBody RoomDto dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "manage-room", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
