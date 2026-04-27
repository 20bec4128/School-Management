package com.School.School_management.Service;

import com.School.School_management.Dto.ClassLectureDto;
import java.util.List;

public interface ClassLectureService {

  ClassLectureDto create(ClassLectureDto dto);

  List<ClassLectureDto> getAll();

  ClassLectureDto getById(Long id);

  ClassLectureDto update(Long id, ClassLectureDto dto);

  void delete(Long id);
}

