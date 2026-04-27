package com.School.School_management.Service;

import com.School.School_management.Dto.SchoolSectionDto;
import java.util.List;

public interface SchoolSectionService {

  SchoolSectionDto create(SchoolSectionDto dto);

  List<SchoolSectionDto> getAll(Long schoolId, Long classId);

  SchoolSectionDto getById(Long id);

  SchoolSectionDto update(Long id, SchoolSectionDto dto);

  void delete(Long id);
}

