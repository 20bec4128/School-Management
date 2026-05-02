package com.School.School_management.Service;

import com.School.School_management.Dto.ClassRoutineDto;

import java.util.List;

public interface ClassRoutineService {

    ClassRoutineDto create(ClassRoutineDto dto);

    List<ClassRoutineDto> getAll(Long schoolId);

    ClassRoutineDto getById(Long id, Long schoolId);

    ClassRoutineDto update(Long id, ClassRoutineDto dto, Long schoolId);

    void delete(Long id, Long schoolId);
}
