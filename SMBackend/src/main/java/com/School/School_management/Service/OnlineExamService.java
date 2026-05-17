package com.School.School_management.Service;

import com.School.School_management.Dto.OnlineExamDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface OnlineExamService {
    List<OnlineExamDto> list(Long schoolId);
    Page<OnlineExamDto> listPaginated(Long schoolId, Long classId, Long subjectId, String isPublish, int page, int size, String search);
    OnlineExamDto create(OnlineExamDto dto);
    OnlineExamDto update(Long id, OnlineExamDto dto);
    void delete(Long id);
}
