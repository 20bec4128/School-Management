package com.School.School_management.Controller;

import com.School.School_management.Dto.TodoTaskDto;
import com.School.School_management.Service.TodoTaskService;
import com.School.School_management.auth.RequirePagePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/todo-tasks")
@RequirePagePermission(slug = "todo-task", action = "view")
public class TodoTaskController {

    private final TodoTaskService service;

    public TodoTaskController(TodoTaskService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePagePermission(slug = "todo-task", action = "view")
    public List<TodoTaskDto> list(@RequestParam(required = false) Long headOfficeId, @RequestParam(required = false) Long schoolId) {
        return service.list(headOfficeId, schoolId);
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "todo-task", action = "view")
    public Page<TodoTaskDto> listPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String userType,
            @RequestParam(required = false) String workStatus,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.listPaginated(headOfficeId, schoolId, userType, workStatus, search, page, size);
    }

    @PostMapping
    @RequirePagePermission(slug = "todo-task", action = "add")
    public TodoTaskDto create(@RequestBody TodoTaskDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "todo-task", action = "edit")
    public TodoTaskDto update(@PathVariable Long id, @RequestBody TodoTaskDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "todo-task", action = "delete")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Todo deleted successfully";
    }
}
