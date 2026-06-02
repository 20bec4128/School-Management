package com.School.School_management.Controller;

import com.School.School_management.Dto.ClassRoutineDto;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.ParentStudentRepository;
import com.School.School_management.Repository.SchoolClassRepository;
import com.School.School_management.Repository.StudentRepository;
import com.School.School_management.Entity.Student;
import com.School.School_management.Service.ClassRoutineService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.auth.RequirePagePermission;
import com.School.School_management.auth.SchoolGuard;
import java.util.List;
import java.util.Objects;
import org.springframework.transaction.annotation.Transactional;
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
@RequirePagePermission(slug = "class-routine", action = "view")
public class ClassRoutineController {

    private final ClassRoutineService service;
    private final SchoolGuard schoolGuard;
    private final SchoolClassRepository schoolClassRepository;
    private final StudentRepository studentRepository;
    private final ParentStudentRepository parentStudentRepository;

    public ClassRoutineController(
            ClassRoutineService service,
            SchoolGuard schoolGuard,
            SchoolClassRepository schoolClassRepository,
            StudentRepository studentRepository,
            ParentStudentRepository parentStudentRepository) {
        this.service = service;
        this.schoolGuard = schoolGuard;
        this.schoolClassRepository = schoolClassRepository;
        this.studentRepository = studentRepository;
        this.parentStudentRepository = parentStudentRepository;
    }

    @PostMapping
    @RequirePagePermission(slug = "class-routine", action = "add")
    public ClassRoutineDto create(@RequestBody ClassRoutineDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        dto.setSchoolId(schoolGuard.schoolIdForWrite(user, dto.getSchoolId()));
        ensureTeacherCanManage(user, dto);
        return service.create(dto);
    }

    @GetMapping
    @RequirePagePermission(slug = "class-routine", action = "view")
    @Transactional(readOnly = true)
    public List<ClassRoutineDto> getAll(@RequestParam(required = false) Long schoolId, @RequestParam(required = false) Long studentId) {
        CurrentUser user = CurrentUserHolder.get();
        Long effectiveSchoolId = schoolGuard.schoolIdForRead(user, schoolId);
        List<ClassRoutineDto> rows = service.getAll(effectiveSchoolId);
        if (user != null && user.isRole("STUDENT")) {
            if (user.studentId() == null) throw new ForbiddenException("Student profile is required");
            Student student = studentRepository.findById(user.studentId())
                    .orElseThrow(() -> new NotFoundException("Student not found"));
            if (student.getSchoolClass() == null || student.getSchoolSection() == null) {
                return List.of();
            }
            Long classId = student.getSchoolClass().getId();
            Long sectionId = student.getSchoolSection().getId();
            return rows.stream()
                    .filter(dto -> Objects.equals(dto.getClassId(), classId) && Objects.equals(dto.getSectionId(), sectionId))
                    .toList();
        }
        if (user != null && user.isRole("PARENT")) {
            if (user.parentId() == null) throw new ForbiddenException("Parent profile is required");
            Long effectiveStudentId = studentId;
            if (effectiveStudentId == null) return List.of();
            List<Long> childStudentIds = parentStudentRepository.findStudentIdsByParentId(user.parentId());
            if (childStudentIds == null || !childStudentIds.contains(effectiveStudentId)) {
                throw new ForbiddenException("Parent can view only their own children");
            }
            Student student = studentRepository.findById(effectiveStudentId)
                    .orElseThrow(() -> new NotFoundException("Student not found"));
            if (student.getSchoolClass() == null || student.getSchoolSection() == null) {
                return List.of();
            }
            Long classId = student.getSchoolClass().getId();
            Long sectionId = student.getSchoolSection().getId();
            return rows.stream()
                    .filter(dto -> Objects.equals(dto.getClassId(), classId) && Objects.equals(dto.getSectionId(), sectionId))
                    .toList();
        }
        return rows;
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "class-routine", action = "view")
    public ClassRoutineDto getById(@PathVariable Long id, @RequestParam(required = false) Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        Long effectiveSchoolId = schoolGuard.schoolIdForRead(user, schoolId);
        return service.getById(id, effectiveSchoolId);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "class-routine", action = "edit")
    public ClassRoutineDto update(@PathVariable Long id, @RequestBody ClassRoutineDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        Long effectiveSchoolId = schoolGuard.schoolIdForWrite(user, dto.getSchoolId());
        dto.setSchoolId(effectiveSchoolId);
        ClassRoutineDto existing = service.getById(id, effectiveSchoolId);
        ensureTeacherCanManage(user, existing);
        ensureTeacherCanManage(user, dto);
        return service.update(id, dto, effectiveSchoolId);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "class-routine", action = "delete")
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
