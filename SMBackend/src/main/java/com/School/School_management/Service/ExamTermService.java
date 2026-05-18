package com.School.School_management.Service;

import com.School.School_management.Dto.ExamTermDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface ExamTermService {
    List<ExamTermDto> list(Long schoolId);

    Page<ExamTermDto> listPaginated(Long schoolId, int page, int size, String search);

    ExamTermDto create(ExamTermDto dto);

    ExamTermDto update(Long id, ExamTermDto dto);

    void delete(Long id);
}
