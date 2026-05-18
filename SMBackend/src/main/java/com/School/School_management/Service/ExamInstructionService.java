package com.School.School_management.Service;

import com.School.School_management.Dto.ExamInstructionDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface ExamInstructionService {
    List<ExamInstructionDto> list(Long schoolId);
    Page<ExamInstructionDto> listPaginated(Long schoolId, String status, int page, int size, String search);
    ExamInstructionDto create(ExamInstructionDto dto);
    ExamInstructionDto update(Long id, ExamInstructionDto dto);
    void delete(Long id);
}
