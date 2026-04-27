package com.School.School_management.Controller;

import com.School.School_management.Dto.SchoolSectionDto;
import com.School.School_management.Service.SchoolSectionService;
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
@RequestMapping("/api/sections")
public class SchoolSectionController {

  private final SchoolSectionService schoolSectionService;

  public SchoolSectionController(SchoolSectionService schoolSectionService) {
    this.schoolSectionService = schoolSectionService;
  }

  @GetMapping
  public List<SchoolSectionDto> getAll(
      @RequestParam(required = false) Long schoolId, @RequestParam(required = false) Long classId) {
    return schoolSectionService.getAll(schoolId, classId);
  }

  @GetMapping("/{id}")
  public SchoolSectionDto getById(@PathVariable Long id) {
    return schoolSectionService.getById(id);
  }

  @PostMapping
  public SchoolSectionDto create(@RequestBody SchoolSectionDto dto) {
    return schoolSectionService.create(dto);
  }

  @PutMapping("/{id}")
  public SchoolSectionDto update(@PathVariable Long id, @RequestBody SchoolSectionDto dto) {
    return schoolSectionService.update(id, dto);
  }

  @DeleteMapping("/{id}")
  public String delete(@PathVariable Long id) {
    schoolSectionService.delete(id);
    return "Section deleted successfully";
  }
}

