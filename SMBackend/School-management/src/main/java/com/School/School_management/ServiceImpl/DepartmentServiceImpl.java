package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.DepartmentDto;
import com.School.School_management.Entity.Department;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Repository.DepartmentRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.DepartmentService;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final SchoolRepository schoolRepository;

    public DepartmentServiceImpl(DepartmentRepository departmentRepository, SchoolRepository schoolRepository) {
        this.departmentRepository = departmentRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DepartmentDto> getAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return departmentRepository.findAll(pageable).map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentDto> getAll() {
        return departmentRepository.findAll(Sort.by("title").ascending())
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public DepartmentDto create(DepartmentDto dto) {
        Department department = toEntity(dto);
        return toDto(departmentRepository.save(department));
    }

    @Override
    public DepartmentDto update(Long id, DepartmentDto dto) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found"));

        department.setSchool(resolveSchool(dto.getSchoolId()));
        department.setTitle(dto.getTitle());
        department.setNote(dto.getNote());
        department.setIsViewOnWeb(dto.getIsViewOnWeb());
        department.setStatus(dto.getStatus());

        return toDto(departmentRepository.save(department));
    }

    @Override
    public void delete(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new RuntimeException("Department not found");
        }
        departmentRepository.deleteById(id);
    }

    private Department toEntity(DepartmentDto dto) {
        Department department = new Department();
        department.setId(dto.getId());
        department.setSchool(resolveSchool(dto.getSchoolId()));
        department.setTitle(dto.getTitle());
        department.setNote(dto.getNote());
        department.setIsViewOnWeb(dto.getIsViewOnWeb());
        department.setStatus(dto.getStatus());
        return department;
    }

    private DepartmentDto toDto(Department department) {
        DepartmentDto dto = new DepartmentDto();
        dto.setId(department.getId());
        if (department.getSchool() != null) {
            dto.setSchoolId(department.getSchool().getId());
            dto.setSchoolName(department.getSchool().getSchoolName());
        }
        dto.setTitle(department.getTitle());
        dto.setNote(department.getNote());
        dto.setIsViewOnWeb(department.getIsViewOnWeb());
        dto.setStatus(department.getStatus());
        return dto;
    }

    private ManageSchool resolveSchool(Long schoolId) {
        if (schoolId == null) {
            throw new RuntimeException("School is required");
        }
        return schoolRepository.findById(schoolId)
                .orElseThrow(() -> new RuntimeException("School not found"));
    }
}
