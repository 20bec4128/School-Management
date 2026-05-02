package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.ClassLectureDto;
import com.School.School_management.Entity.ClassLecture;
import com.School.School_management.Entity.ManageTeacher;
import com.School.School_management.Repository.ClassLectureRepository;
import com.School.School_management.Repository.TeacherRepository;
import com.School.School_management.Service.ClassLectureService;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ClassLectureServiceImpl implements ClassLectureService {

  private final ClassLectureRepository classLectureRepository;
  private final TeacherRepository teacherRepository;

  public ClassLectureServiceImpl(
      ClassLectureRepository classLectureRepository, TeacherRepository teacherRepository) {
    this.classLectureRepository = classLectureRepository;
    this.teacherRepository = teacherRepository;
  }

  @Override
  public ClassLectureDto create(ClassLectureDto dto) {
    ClassLecture entity = toEntity(dto, null);
    return toDto(classLectureRepository.save(entity));
  }

  @Override
  @Transactional(readOnly = true)
  public List<ClassLectureDto> getAll() {
    return classLectureRepository.findAll().stream()
        .sorted(Comparator.comparing(ClassLecture::getId, Comparator.nullsLast(Comparator.reverseOrder())))
        .map(this::toDto)
        .toList();
  }

  @Override
  @Transactional(readOnly = true)
  public ClassLectureDto getById(Long id) {
    return toDto(findLecture(id));
  }

  @Override
  public ClassLectureDto update(Long id, ClassLectureDto dto) {
    ClassLecture existing = findLecture(id);
    ClassLecture updated = toEntity(dto, existing);
    updated.setId(existing.getId());
    return toDto(classLectureRepository.save(updated));
  }

  @Override
  public void delete(Long id) {
    if (!classLectureRepository.existsById(id)) {
      throw new RuntimeException("Class lecture not found");
    }
    classLectureRepository.deleteById(id);
  }

  private ClassLecture findLecture(Long id) {
    return classLectureRepository
        .findById(id)
        .orElseThrow(() -> new RuntimeException("Class lecture not found"));
  }

  private ManageTeacher findTeacher(Long teacherId) {
    if (teacherId == null) {
      throw new RuntimeException("Teacher is required");
    }
    return teacherRepository
        .findById(teacherId)
        .orElseThrow(() -> new RuntimeException("Teacher not found"));
  }

  private ClassLecture toEntity(ClassLectureDto dto, ClassLecture target) {
    ClassLecture entity = target != null ? target : new ClassLecture();
    entity.setSchool(dto.getSchool());
    entity.setTitle(dto.getTitle());
    entity.setClassName(dto.getClassName());
    entity.setSection(dto.getSection());
    entity.setSubject(dto.getSubject());
    entity.setClassLecture(dto.getClassLecture());
    entity.setAcademicYear(dto.getAcademicYear());
    entity.setLectureUrl(dto.getLectureUrl());
    entity.setNote(dto.getNote());
    entity.setTeacher(findTeacher(dto.getTeacherId()));
    return entity;
  }

  private ClassLectureDto toDto(ClassLecture entity) {
    ClassLectureDto dto = new ClassLectureDto();
    dto.setId(entity.getId());
    dto.setSchool(entity.getSchool());
    dto.setTitle(entity.getTitle());
    dto.setClassName(entity.getClassName());
    dto.setSection(entity.getSection());
    dto.setSubject(entity.getSubject());
    dto.setClassLecture(entity.getClassLecture());
    dto.setAcademicYear(entity.getAcademicYear());
    dto.setLectureUrl(entity.getLectureUrl());
    dto.setNote(entity.getNote());
    if (entity.getTeacher() != null) {
      dto.setTeacherId(entity.getTeacher().getId());
      dto.setTeacher(entity.getTeacher().getName());
    }
    return dto;
  }
}
