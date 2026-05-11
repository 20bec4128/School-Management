package com.School.School_management.Service;

import com.School.School_management.Dto.ManageTeacherDto;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface ManageTeacherService {

    ManageTeacherDto createTeacher(ManageTeacherDto dto, MultipartFile photo, MultipartFile resume);

    List<ManageTeacherDto> getAllTeachers();

    ManageTeacherDto getTeacherById(Long id);

    ManageTeacherDto updateTeacher(Long id, ManageTeacherDto dto, MultipartFile photo, MultipartFile resume);

    void deleteTeacher(Long id);
}
