package com.School.School_management.Controller;

import com.School.School_management.Dto.SchoolSectionDto;
import com.School.School_management.Service.SchoolSectionService;
import com.School.School_management.auth.RequirePagePermission;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
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
@RequirePagePermission(slug = "section", action = "view")
public class SchoolSectionController {

  private final SchoolSectionService schoolSectionService;

  public SchoolSectionController(SchoolSectionService schoolSectionService) {
    this.schoolSectionService = schoolSectionService;
  }

  @GetMapping
  @RequirePagePermission(slug = "section", action = "view")
  public List<SchoolSectionDto> getAll(
      @RequestParam(required = false) Long headOfficeId,
      @RequestParam(required = false) Long schoolId,
      @RequestParam(required = false) Long classId) {
    CurrentUser user = CurrentUserHolder.get();
    if (user != null && user.isSchoolScoped()) {
      return schoolSectionService.getAll(user.schoolId(), classId);
    }
    if (user != null && user.isHeadOfficeScopedAdmin() && schoolId == null) {
      // "All schools under head office"
      return schoolSectionService.getAllForHeadOffice(headOfficeId != null ? headOfficeId : user.headOfficeId(), classId);
    }
    if (headOfficeId != null && schoolId == null) {
      return schoolSectionService.getAllForHeadOffice(headOfficeId, classId);
    }
    return schoolSectionService.getAll(schoolId, classId);
  }

  @GetMapping("/{id}")
  @RequirePagePermission(slug = "section", action = "view")
  public SchoolSectionDto getById(@PathVariable Long id) {
    return schoolSectionService.getById(id);
  }

  @PostMapping
  @RequirePagePermission(slug = "section", action = "add")
  public SchoolSectionDto create(@RequestBody SchoolSectionDto dto) {
    return schoolSectionService.create(dto);
  }

  @PutMapping("/{id}")
  @RequirePagePermission(slug = "section", action = "edit")
  public SchoolSectionDto update(@PathVariable Long id, @RequestBody SchoolSectionDto dto) {
    return schoolSectionService.update(id, dto);
  }

  @DeleteMapping("/{id}")
  @RequirePagePermission(slug = "section", action = "delete")
  public String delete(@PathVariable Long id) {
    schoolSectionService.delete(id);
    return "Section deleted successfully";
  }
}

