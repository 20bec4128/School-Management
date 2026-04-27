package com.School.School_management.Service;

import com.School.School_management.Dto.SchoolClassDto;
import java.util.List;

public interface SchoolClassService {

  SchoolClassDto create(SchoolClassDto dto);

  List<SchoolClassDto> getAll(Long schoolId);

  SchoolClassDto getById(Long id);

  SchoolClassDto update(Long id, SchoolClassDto dto);

  void delete(Long id);
}

