// Service/StudyMaterialService.java
package com.School.School_management.Service;

import com.School.School_management.Dto.StudyMaterialRequestDto;
import com.School.School_management.Dto.StudyMaterialResponseDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface StudyMaterialService {
    StudyMaterialResponseDto create(StudyMaterialRequestDto dto, MultipartFile material);
    List<StudyMaterialResponseDto> getAll();
    StudyMaterialResponseDto update(Long id, StudyMaterialRequestDto dto, MultipartFile material);
    void delete(Long id);
}