package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.TodoTaskDto;
import com.School.School_management.Entity.Employee;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.Student;
import com.School.School_management.Entity.TodoTask;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.EmployeeRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.StudentRepository;
import com.School.School_management.Repository.TodoTaskRepository;
import com.School.School_management.Service.TodoTaskService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TodoTaskServiceImpl implements TodoTaskService {

    private final TodoTaskRepository todoTaskRepository;
    private final StudentRepository studentRepository;
    private final EmployeeRepository employeeRepository;
    private final SchoolRepository schoolRepository;

    public TodoTaskServiceImpl(TodoTaskRepository todoTaskRepository, StudentRepository studentRepository, EmployeeRepository employeeRepository, SchoolRepository schoolRepository) {
        this.todoTaskRepository = todoTaskRepository;
        this.studentRepository = studentRepository;
        this.employeeRepository = employeeRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TodoTaskDto> list(Long headOfficeId, Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        List<Long> scopedSchoolIds = resolveSchoolIds(user, headOfficeId, schoolId);
        return fetchScopedRows(scopedSchoolIds).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TodoTaskDto> listPaginated(Long headOfficeId, Long schoolId, String userType, String workStatus, String search, int page, int size) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedUserType = normalizeOptional(userType);
        String normalizedStatus = normalizeOptional(workStatus);
        String normalizedSearch = normalizeOptional(search);
        List<Long> scopedSchoolIds = resolveSchoolIds(user, headOfficeId, schoolId);
        List<TodoTaskDto> filtered = fetchScopedRows(scopedSchoolIds).stream()
                .map(this::toDto)
                .filter(matches(normalizedUserType, normalizedStatus, normalizedSearch))
                .collect(Collectors.toList());
        return slice(filtered, pageable);
    }

    @Override
    public TodoTaskDto create(TodoTaskDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (dto == null) throw new BadRequestException("Request body is required");
        Long effectiveSchoolId = resolveSchoolId(dto.getSchoolId());
        ensureUserCanWrite(user, effectiveSchoolId);
        TodoTask entity = new TodoTask();
        applyDto(entity, dto, effectiveSchoolId);
        return toDto(todoTaskRepository.save(entity));
    }

    @Override
    public TodoTaskDto update(Long id, TodoTaskDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (dto == null) throw new BadRequestException("Request body is required");
        TodoTask entity = todoTaskRepository.findByIdAndDeletedFalse(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = resolveSchoolId(dto.getSchoolId() != null ? dto.getSchoolId() : entity.getSchoolId());
        ensureUserCanWrite(user, effectiveSchoolId);
        applyDto(entity, dto, effectiveSchoolId);
        return toDto(todoTaskRepository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        TodoTask entity = todoTaskRepository.findByIdAndDeletedFalse(id).orElseThrow(NotFoundException::new);
        ensureUserCanRead(user, entity.getSchoolId());
        entity.setDeleted(true);
        todoTaskRepository.save(entity);
    }

    private List<TodoTask> fetchScopedRows(List<Long> scopedSchoolIds) {
        if (scopedSchoolIds == null) return todoTaskRepository.findAllByDeletedFalseOrderByIdDesc();
        if (scopedSchoolIds.isEmpty()) return List.of();
        if (scopedSchoolIds.size() == 1) return todoTaskRepository.findBySchoolIdAndDeletedFalseOrderByIdDesc(scopedSchoolIds.get(0));
        return todoTaskRepository.findBySchoolIdInAndDeletedFalseOrderByIdDesc(scopedSchoolIds);
    }

    private List<Long> resolveSchoolIds(CurrentUser user, Long requestedHeadOfficeId, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return List.of(user.schoolId());
        }
        if (user.isHeadOfficeScopedAdmin()) {
            Long effectiveHeadOfficeId = user.headOfficeId();
            if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, effectiveHeadOfficeId)) throw new ForbiddenException();
            if (requestedSchoolId != null) {
                ensureSchoolInHeadOffice(requestedSchoolId, effectiveHeadOfficeId);
                return List.of(requestedSchoolId);
            }
            return schoolRepository.findAllByIsDeletedFalseAndHeadOfficeId(effectiveHeadOfficeId).stream().map(ManageSchool::getId).toList();
        }
        if (user.isSuperAdmin()) {
            if (requestedSchoolId != null && requestedHeadOfficeId != null) {
                ensureSchoolInHeadOffice(requestedSchoolId, requestedHeadOfficeId);
                return List.of(requestedSchoolId);
            }
            if (requestedSchoolId != null) return List.of(requestedSchoolId);
            if (requestedHeadOfficeId != null) {
                return schoolRepository.findAllByIsDeletedFalseAndHeadOfficeId(requestedHeadOfficeId).stream().map(ManageSchool::getId).toList();
            }
            return null;
        }
        if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
        return List.of(requestedSchoolId);
    }

    private void ensureSchoolInHeadOffice(Long schoolId, Long headOfficeId) {
        boolean ok = schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isPresent();
        if (!ok) throw new NotFoundException();
    }

    private void ensureUserCanRead(CurrentUser user, Long schoolId) { resolveSchoolIds(user, null, schoolId); }
    private void ensureUserCanWrite(CurrentUser user, Long schoolId) { resolveSchoolIds(user, null, schoolId); }

    private Long resolveSchoolId(Long schoolId) {
        if (schoolId == null) throw new BadRequestException("schoolId is required");
        return schoolId;
    }

    private void applyDto(TodoTask entity, TodoTaskDto dto, Long schoolId) {
        entity.setSchoolId(schoolId);
        entity.setSchoolName(resolveSchoolName(schoolId));
        entity.setUserType(normalizeRequired(dto.getUserType(), "User type is required"));
        entity.setAssignToId(dto.getAssignToId());
        entity.setAssignToName(resolveAssignToName(entity.getUserType(), dto.getAssignToId(), dto.getAssignToName(), schoolId));
        entity.setTitle(normalizeRequired(dto.getTitle(), "Title is required"));
        entity.setTodoDate(dto.getTodoDate() != null ? dto.getTodoDate() : LocalDate.now());
        entity.setWorkStatus(normalizeRequired(dto.getWorkStatus(), "Work status is required"));
        entity.setDescription(normalizeOptional(dto.getDescription()));
        entity.setComment(normalizeOptional(dto.getComment()));
    }

    private String resolveAssignToName(String userType, Long assignToId, String fallbackName, Long schoolId) {
        if (assignToId != null) {
            if (isStudentType(userType)) {
                Student student = studentRepository.findById(assignToId).orElseThrow(NotFoundException::new);
                if (student.getSchool() == null || !Objects.equals(student.getSchool().getId(), schoolId)) {
                    throw new BadRequestException("Assigned student does not belong to the selected school");
                }
                return student.getName();
            }
            Employee employee = employeeRepository.findById(assignToId).orElseThrow(NotFoundException::new);
            if (employee.getSchoolId() == null || !Objects.equals(employee.getSchoolId(), schoolId)) {
                throw new BadRequestException("Assigned employee does not belong to the selected school");
            }
            return employee.getName();
        }
        String normalized = normalizeOptional(fallbackName);
        if (normalized == null) throw new BadRequestException("Assign To is required");
        return normalized;
    }

    private boolean isStudentType(String userType) {
        String normalized = normalizeOptional(userType);
        return normalized != null && normalized.toLowerCase(Locale.ENGLISH).contains("student");
    }

    private String resolveSchoolName(Long schoolId) {
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId).map(ManageSchool::getSchoolName).orElse(null);
    }

    private String normalizeRequired(String value, String message) {
        if (value == null) throw new BadRequestException(message);
        String trimmed = value.trim();
        if (trimmed.isEmpty()) throw new BadRequestException(message);
        return trimmed;
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Predicate<TodoTaskDto> matches(String userType, String workStatus, String search) {
        String normalizedSearch = search == null ? null : search.toLowerCase(Locale.ENGLISH);
        return dto -> {
            boolean matchesUserType = userType == null || safe(dto.getUserType()).equalsIgnoreCase(userType);
            boolean matchesStatus = workStatus == null || safe(dto.getWorkStatus()).equalsIgnoreCase(workStatus);
            boolean matchesSearch = normalizedSearch == null || String.join(" ",
                    safe(dto.getSchoolName()), safe(dto.getUserType()), safe(dto.getAssignToName()), safe(dto.getTitle()),
                    safe(dto.getWorkStatus()), safe(dto.getDescription()), safe(dto.getComment()))
                    .toLowerCase(Locale.ENGLISH)
                    .contains(normalizedSearch);
            return matchesUserType && matchesStatus && matchesSearch;
        };
    }

    private Page<TodoTaskDto> slice(List<TodoTaskDto> rows, Pageable pageable) {
        int start = Math.min(pageable.getPageNumber() * pageable.getPageSize(), rows.size());
        int end = Math.min(start + pageable.getPageSize(), rows.size());
        return new PageImpl<>(rows.subList(start, end), pageable, rows.size());
    }

    private TodoTaskDto toDto(TodoTask entity) {
        TodoTaskDto dto = new TodoTaskDto();
        dto.setId(entity.getId());
        dto.setHeadOfficeId(entity.getHeadOfficeId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setSchoolName(entity.getSchoolName());
        dto.setUserType(entity.getUserType());
        dto.setAssignToId(entity.getAssignToId());
        dto.setAssignToName(entity.getAssignToName());
        dto.setTitle(entity.getTitle());
        dto.setTodoDate(entity.getTodoDate());
        dto.setWorkStatus(entity.getWorkStatus());
        dto.setDescription(entity.getDescription());
        dto.setComment(entity.getComment());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    private String safe(String value) { return value == null ? "" : value; }
}
