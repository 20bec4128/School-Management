package com.School.School_management.Controller;

import com.School.School_management.Dto.LiveClassEndResponseDto;
import com.School.School_management.Dto.LiveClassJoinResponseDto;
import com.School.School_management.Dto.LiveClassRequestDto;
import com.School.School_management.Dto.LiveClassResponseDto;
import com.School.School_management.Dto.LiveClassStartResponseDto;
import com.School.School_management.Service.LiveClassService;
import com.School.School_management.auth.RequirePermission;
import java.util.List;
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
@RequestMapping("/api/live-classes")
public class LiveClassController {

    private final LiveClassService liveClassService;

    public LiveClassController(LiveClassService liveClassService) {
        this.liveClassService = liveClassService;
    }

    @RequirePermission({"LIVE_CLASS_MANAGE", "LIVE_CLASS_VIEW_OWN", "LIVE_CLASS_VIEW_CHILD", "LIVE_CLASS_MANAGE_ASSIGNED", "*"})
    @GetMapping
    public List<LiveClassResponseDto> getAll() {
        return liveClassService.getAll();
    }

    @RequirePermission({"LIVE_CLASS_MANAGE", "LIVE_CLASS_VIEW_OWN", "LIVE_CLASS_VIEW_CHILD", "LIVE_CLASS_MANAGE_ASSIGNED", "*"})
    @GetMapping("/{id}")
    public LiveClassResponseDto getById(@PathVariable Long id) {
        return liveClassService.getById(id);
    }

    @RequirePermission({"LIVE_CLASS_VIEW_OWN", "*"})
    @GetMapping("/student")
    public List<LiveClassResponseDto> getForStudent(@RequestParam Long classId, @RequestParam Long sectionId) {
        return liveClassService.getForStudent(classId, sectionId);
    }

    @RequirePermission({"LIVE_CLASS_MANAGE", "LIVE_CLASS_MANAGE_ASSIGNED", "*"})
    @PostMapping
    public LiveClassResponseDto create(@RequestBody LiveClassRequestDto dto) {
        return liveClassService.create(dto);
    }

    @RequirePermission({"LIVE_CLASS_MANAGE", "LIVE_CLASS_MANAGE_ASSIGNED", "*"})
    @PostMapping("/{id}/start")
    public LiveClassStartResponseDto start(@PathVariable Long id) {
        return liveClassService.start(id);
    }

    @RequirePermission({"LIVE_CLASS_JOIN", "LIVE_CLASS_MANAGE", "LIVE_CLASS_MANAGE_ASSIGNED", "*"})
    @PostMapping("/{id}/join")
    public LiveClassJoinResponseDto join(@PathVariable Long id) {
        return liveClassService.join(id);
    }

    @RequirePermission({"LIVE_CLASS_JOIN", "LIVE_CLASS_MANAGE", "LIVE_CLASS_MANAGE_ASSIGNED", "*"})
    @PostMapping("/{id}/leave")
    public String leave(@PathVariable Long id) {
        liveClassService.leave(id);
        return "OK";
    }

    @RequirePermission({"LIVE_CLASS_MANAGE", "LIVE_CLASS_MANAGE_ASSIGNED", "*"})
    @PostMapping("/{id}/end")
    public LiveClassEndResponseDto end(@PathVariable Long id) {
        return liveClassService.end(id);
    }

    @RequirePermission({"LIVE_CLASS_MANAGE", "LIVE_CLASS_MANAGE_ASSIGNED", "*"})
    @PutMapping("/{id}")
    public LiveClassResponseDto update(@PathVariable Long id, @RequestBody LiveClassRequestDto dto) {
        return liveClassService.update(id, dto);
    }

    @RequirePermission({"LIVE_CLASS_MANAGE", "LIVE_CLASS_MANAGE_ASSIGNED", "*"})
    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        liveClassService.delete(id);
        return "Live class deleted successfully";
    }
}
