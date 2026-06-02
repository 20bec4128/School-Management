package com.School.School_management.Controller;

import com.School.School_management.Dto.SchoolClassDto;
import com.School.School_management.Service.SchoolClassService;
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
@RequestMapping("/api/classes")
@RequirePagePermission(slug = "class", action = "view")
public class SchoolClassController {

  private final SchoolClassService schoolClassService;

  public SchoolClassController(SchoolClassService schoolClassService) {
    this.schoolClassService = schoolClassService;
  }

    @GetMapping
    @RequirePagePermission(slug = "class", action = "view")
    public List<SchoolClassDto> getAll(@RequestParam(required = false) Long schoolId) {
      CurrentUser user = CurrentUserHolder.get();
    if (user != null && user.isSchoolScoped()) {
      return schoolClassService.getAll(user.schoolId());
    }
    if (user != null && user.isHeadOfficeScopedAdmin() && schoolId == null) {
      // "All schools under head office"
      return schoolClassService.getAllForHeadOffice(user.headOfficeId());
    }
    return schoolClassService.getAll(schoolId);
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "class", action = "view")
    public SchoolClassDto getById(@PathVariable Long id) {
      return schoolClassService.getById(id);
    }

    @PostMapping
    @RequirePagePermission(slug = "class", action = "add")
    public SchoolClassDto create(@RequestBody SchoolClassDto dto) {
      return schoolClassService.create(dto);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "class", action = "edit")
    public SchoolClassDto update(@PathVariable Long id, @RequestBody SchoolClassDto dto) {
      return schoolClassService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "class", action = "delete")
    public String delete(@PathVariable Long id) {
      schoolClassService.delete(id);
      return "Class deleted successfully";
  }
}

