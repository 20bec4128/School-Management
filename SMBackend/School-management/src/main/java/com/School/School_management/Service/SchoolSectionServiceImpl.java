package com.School.School_management.Service;

import com.School.School_management.Dto.SchoolSectionDto;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.ManageTeacher;
import com.School.School_management.Entity.SchoolClass;
import com.School.School_management.Entity.SchoolSection;
import com.School.School_management.Repository.SchoolClassRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.SchoolSectionRepository;
import com.School.School_management.Repository.TeacherRepository;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SchoolSectionServiceImpl implements SchoolSectionService {

  private final SchoolSectionRepository schoolSectionRepository;
  private final SchoolRepository schoolRepository;
  private final SchoolClassRepository schoolClassRepository;
  private final TeacherRepository teacherRepository;

  public SchoolSectionServiceImpl(
      SchoolSectionRepository schoolSectionRepository,
      SchoolRepository schoolRepository,
      SchoolClassRepository schoolClassRepository,
      TeacherRepository teacherRepository) {
    this.schoolSectionRepository = schoolSectionRepository;
    this.schoolRepository = schoolRepository;
    this.schoolClassRepository = schoolClassRepository;
    this.teacherRepository = teacherRepository;
  }

  @Override
  public SchoolSectionDto create(SchoolSectionDto dto) {
    SchoolSection entity = toEntity(dto, null);
    return toDto(schoolSectionRepository.save(entity));
  }

  @Override
  @Transactional(readOnly = true)
  public List<SchoolSectionDto> getAll(Long schoolId, Long classId) {
    List<SchoolSection> rows;
    if (schoolId != null && classId != null) {
      rows = schoolSectionRepository.findAllBySchool_IdAndSchoolClass_IdOrderByIdDesc(schoolId, classId);
    } else if (classId != null) {
      rows = schoolSectionRepository.findAllBySchoolClass_IdOrderByIdDesc(classId);
    } else if (schoolId != null) {
      rows = schoolSectionRepository.findAllBySchool_IdOrderByIdDesc(schoolId);
    } else {
      rows = schoolSectionRepository.findAll(Sort.by("id").descending());
    }
    return rows.stream().map(this::toDto).toList();
  }

  @Override
  @Transactional(readOnly = true)
  public SchoolSectionDto getById(Long id) {
    return toDto(findSection(id));
  }

  @Override
  public SchoolSectionDto update(Long id, SchoolSectionDto dto) {
    SchoolSection existing = findSection(id);
    SchoolSection updated = toEntity(dto, existing);
    updated.setId(existing.getId());
    return toDto(schoolSectionRepository.save(updated));
  }

  @Override
  public void delete(Long id) {
    if (!schoolSectionRepository.existsById(id)) {
      throw new RuntimeException("Section not found");
    }
    schoolSectionRepository.deleteById(id);
  }

  private SchoolSection findSection(Long id) {
    return schoolSectionRepository.findById(id).orElseThrow(() -> new RuntimeException("Section not found"));
  }

  private ManageSchool resolveSchool(Long schoolId) {
    if (schoolId == null) {
      throw new RuntimeException("School is required");
    }
    return schoolRepository.findById(schoolId).orElseThrow(() -> new RuntimeException("School not found"));
  }

  private SchoolClass resolveClass(Long classId) {
    if (classId == null) {
      throw new RuntimeException("Class is required");
    }
    return schoolClassRepository.findById(classId).orElseThrow(() -> new RuntimeException("Class not found"));
  }

  private ManageTeacher resolveTeacher(Long teacherId) {
    if (teacherId == null) return null;
    return teacherRepository.findById(teacherId).orElseThrow(() -> new RuntimeException("Teacher not found"));
  }

  private SchoolSection toEntity(SchoolSectionDto dto, SchoolSection target) {
    SchoolSection entity = target != null ? target : new SchoolSection();
    entity.setSchool(resolveSchool(dto.getSchoolId()));
    entity.setSchoolClass(resolveClass(dto.getClassId()));
    entity.setName(dto.getName());
    entity.setClassTeacher(resolveTeacher(dto.getTeacherId()));
    entity.setNote(dto.getNote());
    return entity;
  }

  private SchoolSectionDto toDto(SchoolSection entity) {
    SchoolSectionDto dto = new SchoolSectionDto();
    dto.setId(entity.getId());
    if (entity.getSchool() != null) {
      dto.setSchoolId(entity.getSchool().getId());
      dto.setSchoolName(entity.getSchool().getSchoolName());
    }
    if (entity.getSchoolClass() != null) {
      dto.setClassId(entity.getSchoolClass().getId());
      dto.setClassName(entity.getSchoolClass().getClassName());
    }
    if (entity.getClassTeacher() != null) {
      dto.setTeacherId(entity.getClassTeacher().getId());
      dto.setTeacherName(entity.getClassTeacher().getName());
    }
    dto.setName(entity.getName());
    dto.setNote(entity.getNote());
    return dto;
  }
}

