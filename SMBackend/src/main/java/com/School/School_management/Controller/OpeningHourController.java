package com.School.School_management.Controller;

import com.School.School_management.Dto.OpeningHourDto;
import com.School.School_management.Service.OpeningHourService;
import com.School.School_management.auth.RequirePermission;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/opening-hours")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class OpeningHourController {

    private final OpeningHourService openingHourService;

    public OpeningHourController(OpeningHourService openingHourService) {
        this.openingHourService = openingHourService;
    }

    @GetMapping
    public Page<OpeningHourDto> getOpeningHours(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return openingHourService.getOpeningHours(schoolId, page, size);
    }

    @GetMapping("/{id}")
    public OpeningHourDto getOpeningHourById(@PathVariable Long id) {
        return openingHourService.getOpeningHourById(id);
    }

    @PostMapping
    public OpeningHourDto createOpeningHour(@RequestBody OpeningHourDto dto) {
        return openingHourService.createOpeningHour(dto);
    }

    @PutMapping("/{id}")
    public OpeningHourDto updateOpeningHour(
            @PathVariable Long id,
            @RequestBody OpeningHourDto dto
    ) {
        return openingHourService.updateOpeningHour(id, dto);
    }

    @PatchMapping("/{id}/toggle-status")
    public OpeningHourDto toggleStatus(@PathVariable Long id) {
        return openingHourService.toggleStatus(id);
    }

    @DeleteMapping("/{id}")
    public String deleteOpeningHour(@PathVariable Long id) {
        openingHourService.deleteOpeningHour(id);
        return "Opening hour deleted successfully";
    }
}
