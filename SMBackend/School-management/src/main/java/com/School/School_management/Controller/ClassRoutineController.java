package com.School.School_management.Controller;

import com.School.School_management.Dto.ClassRoutineDto;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Repository.SchoolClassRepository;
import com.School.School_management.Service.ClassRoutineService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.auth.RequirePermission;
import com.School.School_management.auth.SchoolGuard;
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
@RequestMapping("/api/class-routines")
@RequirePermission({"CLASS_ROUTINE_VIEW", "CLASS_ROUTINE_MANAGE", "*"})
public class ClassRoutineController {

    private final ClassRoutineService service;
    private final SchoolGuard schoolGuard;
    private final SchoolClassRepository schoolClassRepository;

    public ClassRoutineController(
            ClassRoutineService service,
            SchoolGuard schoolGuard,
            SchoolClassRepository schoolClassRepository) {
        this.service = service;
        this.schoolGuard = schoolGuard;
        this.schoolClassRepository = schoolClassRepository;
    }

    @RequirePermission({"CLASS_ROUTINE_MANAGE", "*"})
    @PostMapping
    public ClassRoutineDto create(@RequestBody ClassRoutineDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        dto.setSchoolId(schoolGuard.schoolIdForWrite(user, dto.getSchoolId()));
        ensureTeacherCanManage(user, dto);
        return service.create(dto);
    }

    @RequirePermission({"CLASS_ROUTINE_VIEW", "CLASS_ROUTINE_MANAGE", "*"})
    @GetMapping
    public List<ClassRoutineDto> getAll(@RequestParam(required = false) Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        Long effectiveSchoolId = schoolGuard.schoolIdForRead(user, schoolId);
        return service.getAll(effectiveSchoolId);
    }

    @RequirePermission({"CLASS_ROUTINE_VIEW", "CLASS_ROUTINE_MANAGE", "*"})
    @GetMapping("/{id}")
    public ClassRoutineDto getById(@PathVariable Long id, @RequestParam(required = false) Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        Long effectiveSchoolId = schoolGuard.schoolIdForRead(user, schoolId);
        return service.getById(id, effectiveSchoolId);
    }

    @RequirePermission({"CLASS_ROUTINE_MANAGE", "*"})
    @PutMapping("/{id}")
    public ClassRoutineDto update(@PathVariable Long id, @RequestBody ClassRoutineDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        Long effectiveSchoolId = schoolGuard.schoolIdForWrite(user, dto.getSchoolId());
        dto.setSchoolId(effectiveSchoolId);
        ClassRoutineDto existing = service.getById(id, effectiveSchoolId);
        ensureTeacherCanManage(user, existing);
        ensureTeacherCanManage(user, dto);
        return service.update(id, dto, effectiveSchoolId);
    }

    @RequirePermission({"CLASS_ROUTINE_MANAGE", "*"})
    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id, @RequestParam(required = false) Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        Long effectiveSchoolId = schoolGuard.schoolIdForWrite(user, schoolId);
        ClassRoutineDto existing = service.getById(id, effectiveSchoolId);
        ensureTeacherCanManage(user, existing);
        service.delete(id, effectiveSchoolId);
        return "Class routine deleted successfully";
    }

    private void ensureTeacherCanManage(CurrentUser user, ClassRoutineDto dto) {
        if (user == null) throw new ForbiddenException();
        if (!user.isRole("TEACHER")) return;
        if (user.teacherId() == null) throw new ForbiddenException("Teacher profile is required");
        if (dto == null) throw new BadRequestException("Class routine details are required");
        if (dto.getSchoolId() == null) throw new BadRequestException("School is required");
        if (dto.getClassId() == null) throw new BadRequestException("Class is required");
        if (dto.getTeacherId() == null || !user.teacherId().equals(dto.getTeacherId())) {
            throw new ForbiddenException("Teacher can manage only their own routines");
        }
        boolean ownsClass = schoolClassRepository.existsByIdAndSchool_IdAndClassTeacher_Id(
                dto.getClassId(), dto.getSchoolId(), user.teacherId());
        if (!ownsClass) throw new ForbiddenException("Teacher can manage routines only for assigned classes");
    }
}
