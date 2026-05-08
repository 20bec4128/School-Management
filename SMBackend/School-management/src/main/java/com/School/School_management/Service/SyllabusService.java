package com.School.School_management.Service;

import com.School.School_management.Dto.SyllabusResponseDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface SyllabusService {

    List<SyllabusResponseDto> getAllSyllabuses(Long schoolId, Long classId);

    SyllabusResponseDto getSyllabusById(Long id);

    SyllabusResponseDto createSyllabus(
            Long schoolId,
            Long classId,
            Long subjectId,
            String title,
            String sessionYear,
            String note,
            MultipartFile file
    );

    SyllabusResponseDto updateSyllabus(
            Long id,
            Long schoolId,
            Long classId,
            Long subjectId,
            String title,
            String sessionYear,
            String note,
            MultipartFile file
    );

    void deleteSyllabus(Long id);
}
