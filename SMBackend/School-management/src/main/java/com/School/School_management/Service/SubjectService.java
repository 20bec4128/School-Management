package com.School.School_management.Service;

import com.School.School_management.Dto.SubjectRequestDto;
import com.School.School_management.Dto.SubjectResponseDto;

import java.util.List;

public interface SubjectService {

    List<SubjectResponseDto> getAllSubjects();

    SubjectResponseDto getSubjectById(Long id);

    SubjectResponseDto createSubject(SubjectRequestDto requestDto);

    SubjectResponseDto updateSubject(Long id, SubjectRequestDto requestDto);

    void deleteSubject(Long id);
}