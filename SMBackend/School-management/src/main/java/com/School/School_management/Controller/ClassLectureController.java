package com.School.School_management.Controller;

import com.School.School_management.Dto.ClassLectureDto;
import com.School.School_management.Service.ClassLectureService;
import com.School.School_management.auth.RequirePermission;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/class-lectures")
@RequirePermission({"CLASS_VIEW_ASSIGNED", "CLASS_MANAGE", "*"})
public class ClassLectureController {

  private final ClassLectureService classLectureService;

  public ClassLectureController(ClassLectureService classLectureService) {
    this.classLectureService = classLectureService;
  }

  @GetMapping
  public List<ClassLectureDto> getAll() {
    return classLectureService.getAll();
  }

  @GetMapping("/{id}")
  public ClassLectureDto getById(@PathVariable Long id) {
    return classLectureService.getById(id);
  }

  @PostMapping
  @RequirePermission({"CLASS_MANAGE", "*"})
  public ClassLectureDto create(@RequestBody ClassLectureDto dto) {
    return classLectureService.create(dto);
  }

  @PutMapping("/{id}")
  @RequirePermission({"CLASS_MANAGE", "*"})
  public ClassLectureDto update(@PathVariable Long id, @RequestBody ClassLectureDto dto) {
    return classLectureService.update(id, dto);
  }

  @DeleteMapping("/{id}")
  @RequirePermission({"CLASS_MANAGE", "*"})
  public String delete(@PathVariable Long id) {
    classLectureService.delete(id);
    return "Class lecture deleted successfully";
  }
}

