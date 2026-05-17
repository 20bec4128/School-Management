package com.School.School_management.Controller;

import com.School.School_management.Dto.CallLogDto;
import com.School.School_management.Service.CallLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/call-logs")
public class CallLogController {

    @Autowired
    private CallLogService service;

    @GetMapping("/school/{schoolId}")
    public List<CallLogDto> getAllBySchool(@PathVariable Long schoolId) {
        return service.getAllBySchool(schoolId);
    }

    @GetMapping("/page")
    public Page<CallLogDto> page(
            @RequestParam Long schoolId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String callType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.pageBySchool(schoolId, search, callType, page, size);
    }

    @PostMapping
    public CallLogDto create(@RequestBody CallLogDto dto) {
        return service.save(dto);
    }

    @PutMapping("/{id}")
    public CallLogDto update(@PathVariable Long id, @RequestBody CallLogDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
