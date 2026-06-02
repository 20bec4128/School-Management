package com.School.School_management.Controller;

import com.School.School_management.Dto.LiveClassEndResponseDto;
import com.School.School_management.Dto.LiveClassJoinResponseDto;
import com.School.School_management.Dto.LiveClassRequestDto;
import com.School.School_management.Dto.LiveClassResponseDto;
import com.School.School_management.Dto.LiveClassStartResponseDto;
import com.School.School_management.Service.LiveClassService;
import com.School.School_management.auth.RequirePagePermission;
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
@RequirePagePermission(slug = "live-class", action = "view")
public class LiveClassController {

    private final LiveClassService liveClassService;

    public LiveClassController(LiveClassService liveClassService) {
        this.liveClassService = liveClassService;
    }

    @GetMapping
    @RequirePagePermission(slug = "live-class", action = "view")
    public List<LiveClassResponseDto> getAll() {
        return liveClassService.getAll();
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "live-class", action = "view")
    public LiveClassResponseDto getById(@PathVariable Long id) {
        return liveClassService.getById(id);
    }

    @GetMapping("/student")
    @RequirePagePermission(slug = "live-class", action = "view")
    public List<LiveClassResponseDto> getForStudent(@RequestParam Long classId, @RequestParam Long sectionId) {
        return liveClassService.getForStudent(classId, sectionId);
    }

    @PostMapping
    @RequirePagePermission(slug = "live-class", action = "add")
    public LiveClassResponseDto create(@RequestBody LiveClassRequestDto dto) {
        return liveClassService.create(dto);
    }

    @PostMapping("/{id}/start")
    @RequirePagePermission(slug = "live-class", action = "edit")
    public LiveClassStartResponseDto start(@PathVariable Long id) {
        return liveClassService.start(id);
    }

    @PostMapping("/{id}/join")
    @RequirePagePermission(slug = "live-class", action = "edit")
    public LiveClassJoinResponseDto join(@PathVariable Long id) {
        return liveClassService.join(id);
    }

    @PostMapping("/{id}/leave")
    @RequirePagePermission(slug = "live-class", action = "edit")
    public String leave(@PathVariable Long id) {
        liveClassService.leave(id);
        return "OK";
    }

    @PostMapping("/{id}/end")
    @RequirePagePermission(slug = "live-class", action = "edit")
    public LiveClassEndResponseDto end(@PathVariable Long id) {
        return liveClassService.end(id);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "live-class", action = "edit")
    public LiveClassResponseDto update(@PathVariable Long id, @RequestBody LiveClassRequestDto dto) {
        return liveClassService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "live-class", action = "delete")
    public String delete(@PathVariable Long id) {
        liveClassService.delete(id);
        return "Live class deleted successfully";
    }
}
