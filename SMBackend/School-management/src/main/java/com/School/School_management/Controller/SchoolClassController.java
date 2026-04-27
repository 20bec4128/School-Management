package com.School.School_management.Controller;

import com.School.School_management.Dto.SchoolClassDto;
import com.School.School_management.Service.SchoolClassService;
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
@RequestMapping("/api/classes")
public class SchoolClassController {

  private final SchoolClassService schoolClassService;

  public SchoolClassController(SchoolClassService schoolClassService) {
    this.schoolClassService = schoolClassService;
  }

  @GetMapping
  public List<SchoolClassDto> getAll(@RequestParam(required = false) Long schoolId) {
    return schoolClassService.getAll(schoolId);
  }

  @GetMapping("/{id}")
  public SchoolClassDto getById(@PathVariable Long id) {
    return schoolClassService.getById(id);
  }

  @PostMapping
  public SchoolClassDto create(@RequestBody SchoolClassDto dto) {
    return schoolClassService.create(dto);
  }

  @PutMapping("/{id}")
  public SchoolClassDto update(@PathVariable Long id, @RequestBody SchoolClassDto dto) {
    return schoolClassService.update(id, dto);
  }

  @DeleteMapping("/{id}")
  public String delete(@PathVariable Long id) {
    schoolClassService.delete(id);
    return "Class deleted successfully";
  }
}

