package com.School.School_management.Controller;

import com.School.School_management.Dto.OpeningHourDto;
import com.School.School_management.Service.OpeningHourService;
import com.School.School_management.auth.RequirePagePermission;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/opening-hours")
@RequirePagePermission(slug = "opening-hour", action = "view")
public class OpeningHourController {

    private final OpeningHourService openingHourService;

    public OpeningHourController(OpeningHourService openingHourService) {
        this.openingHourService = openingHourService;
    }

    @GetMapping
    @RequirePagePermission(slug = "opening-hour", action = "view")
    public Page<OpeningHourDto> getOpeningHours(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return openingHourService.getOpeningHours(schoolId, page, size);
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "opening-hour", action = "view")
    public OpeningHourDto getOpeningHourById(@PathVariable Long id) {
        return openingHourService.getOpeningHourById(id);
    }

    @PostMapping
    @RequirePagePermission(slug = "opening-hour", action = "add")
    public OpeningHourDto createOpeningHour(@RequestBody OpeningHourDto dto) {
        return openingHourService.createOpeningHour(dto);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "opening-hour", action = "edit")
    public OpeningHourDto updateOpeningHour(
            @PathVariable Long id,
            @RequestBody OpeningHourDto dto
    ) {
        return openingHourService.updateOpeningHour(id, dto);
    }

    @PatchMapping("/{id}/toggle-status")
    @RequirePagePermission(slug = "opening-hour", action = "edit")
    public OpeningHourDto toggleStatus(@PathVariable Long id) {
        return openingHourService.toggleStatus(id);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "opening-hour", action = "delete")
    public String deleteOpeningHour(@PathVariable Long id) {
        openingHourService.deleteOpeningHour(id);
        return "Opening hour deleted successfully";
    }
}
