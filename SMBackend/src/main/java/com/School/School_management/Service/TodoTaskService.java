package com.School.School_management.Service;

import com.School.School_management.Dto.TodoTaskDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface TodoTaskService {
    List<TodoTaskDto> list(Long headOfficeId, Long schoolId);
    Page<TodoTaskDto> listPaginated(Long headOfficeId, Long schoolId, String userType, String workStatus, String search, int page, int size);
    TodoTaskDto create(TodoTaskDto dto);
    TodoTaskDto update(Long id, TodoTaskDto dto);
    void delete(Long id);
}
