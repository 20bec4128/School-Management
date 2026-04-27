package com.School.School_management.Service;

import com.School.School_management.Dto.SchoolClassDto;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.ManageTeacher;
import com.School.School_management.Entity.SchoolClass;
import com.School.School_management.Repository.SchoolClassRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.TeacherRepository;
import java.util.Comparator;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SchoolClassServiceImpl implements SchoolClassService {

  private final SchoolClassRepository schoolClassRepository;
  private final SchoolRepository schoolRepository;
  private final TeacherRepository teacherRepository;

  public SchoolClassServiceImpl(
      SchoolClassRepository schoolClassRepository,
      SchoolRepository schoolRepository,
      TeacherRepository teacherRepository) {
    this.schoolClassRepository = schoolClassRepository;
    this.schoolRepository = schoolRepository;
    this.teacherRepository = teacherRepository;
  }

  @Override
  public SchoolClassDto create(SchoolClassDto dto) {
    SchoolClass entity = toEntity(dto, null);
    return toDto(schoolClassRepository.save(entity));
  }

  @Override
  @Transactional(readOnly = true)
  public List<SchoolClassDto> getAll(Long schoolId) {
    List<SchoolClass> rows;
    if (schoolId != null) {
      rows = schoolClassRepository.findAllBySchool_IdOrderByIdDesc(schoolId);
    } else {
      rows =
          schoolClassRepository.findAll(Sort.by("id").descending()).stream()
              .sorted(
                  Comparator.comparing(
                      SchoolClass::getId, Comparator.nullsLast(Comparator.reverseOrder())))
              .toList();
    }
    return rows.stream().map(this::toDto).toList();
  }

  @Override
  @Transactional(readOnly = true)
  public SchoolClassDto getById(Long id) {
    return toDto(findClass(id));
  }

  @Override
  public SchoolClassDto update(Long id, SchoolClassDto dto) {
    SchoolClass existing = findClass(id);
    SchoolClass updated = toEntity(dto, existing);
    updated.setId(existing.getId());
    return toDto(schoolClassRepository.save(updated));
  }

  @Override
  public void delete(Long id) {
    if (!schoolClassRepository.existsById(id)) {
      throw new RuntimeException("Class not found");
    }
    schoolClassRepository.deleteById(id);
  }

  private SchoolClass findClass(Long id) {
    return schoolClassRepository.findById(id).orElseThrow(() -> new RuntimeException("Class not found"));
  }

  private ManageSchool resolveSchool(Long schoolId) {
    if (schoolId == null) {
      throw new RuntimeException("School is required");
    }
    return schoolRepository.findById(schoolId).orElseThrow(() -> new RuntimeException("School not found"));
  }

  private ManageTeacher resolveTeacher(Long teacherId) {
    if (teacherId == null) return null;
    return teacherRepository.findById(teacherId).orElseThrow(() -> new RuntimeException("Teacher not found"));
  }

  private SchoolClass toEntity(SchoolClassDto dto, SchoolClass target) {
    SchoolClass entity = target != null ? target : new SchoolClass();
    entity.setSchool(resolveSchool(dto.getSchoolId()));
    entity.setClassName(dto.getClassName());
    entity.setNumericName(dto.getNumericName());
    entity.setClassTeacher(resolveTeacher(dto.getTeacherId()));
    entity.setNote(dto.getNote());
    return entity;
  }

  private SchoolClassDto toDto(SchoolClass entity) {
    SchoolClassDto dto = new SchoolClassDto();
    dto.setId(entity.getId());
    if (entity.getSchool() != null) {
      dto.setSchoolId(entity.getSchool().getId());
      dto.setSchoolName(entity.getSchool().getSchoolName());
    }
    dto.setClassName(entity.getClassName());
    dto.setNumericName(entity.getNumericName());
    if (entity.getClassTeacher() != null) {
      dto.setTeacherId(entity.getClassTeacher().getId());
      dto.setTeacherName(entity.getClassTeacher().getName());
    }
    dto.setNote(entity.getNote());
    return dto;
  }
}

