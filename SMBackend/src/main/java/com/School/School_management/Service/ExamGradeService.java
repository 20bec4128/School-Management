package com.School.School_management.Service;

import com.School.School_management.Dto.ExamGradeDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface ExamGradeService {
    List<ExamGradeDto> list(Long headOfficeId, Long schoolId);

    Page<ExamGradeDto> listPaginated(Long headOfficeId, Long schoolId, int page, int size, String search);

    ExamGradeDto create(ExamGradeDto dto);

    ExamGradeDto update(Long id, ExamGradeDto dto);

    void delete(Long id);
}
