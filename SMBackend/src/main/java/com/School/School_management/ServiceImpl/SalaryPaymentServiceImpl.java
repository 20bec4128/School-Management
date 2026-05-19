package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.SalaryGradeDto;
import com.School.School_management.Dto.SalaryPaymentDto;
import com.School.School_management.Entity.Employee;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.SalaryGrade;
import com.School.School_management.Entity.SalaryPayment;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.EmployeeRepository;
import com.School.School_management.Repository.SalaryGradeRepository;
import com.School.School_management.Repository.SalaryPaymentRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.SalaryPaymentService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
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
public class SalaryPaymentServiceImpl implements SalaryPaymentService {

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);

    private final SalaryPaymentRepository salaryPaymentRepository;
    private final EmployeeRepository employeeRepository;
    private final SalaryGradeRepository salaryGradeRepository;
    private final SchoolRepository schoolRepository;

    public SalaryPaymentServiceImpl(
            SalaryPaymentRepository salaryPaymentRepository,
            EmployeeRepository employeeRepository,
            SalaryGradeRepository salaryGradeRepository,
            SchoolRepository schoolRepository
    ) {
        this.salaryPaymentRepository = salaryPaymentRepository;
        this.employeeRepository = employeeRepository;
        this.salaryGradeRepository = salaryGradeRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalaryPaymentDto> list(Long headOfficeId, Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        List<Long> scopedSchoolIds = resolveSchoolIds(user, headOfficeId, schoolId);
        List<SalaryPayment> rows = fetchScopedRows(scopedSchoolIds);
        return rows.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SalaryPaymentDto> listPaginated(
            Long headOfficeId,
            Long schoolId,
            String month,
            String gradeName,
            String salaryType,
            String status,
            int page,
            int size,
            String search
    ) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedSearch = normalizeOptional(search);
        String normalizedMonth = normalizeOptional(month);
        String normalizedGrade = normalizeOptional(gradeName);
        String normalizedType = normalizeOptional(salaryType);
        String normalizedStatus = normalizeOptional(status);

        List<Long> scopedSchoolIds = resolveSchoolIds(user, headOfficeId, schoolId);
        List<SalaryPaymentDto> filtered = fetchScopedRows(scopedSchoolIds).stream()
                .map(this::toDto)
                .filter(matches(normalizedMonth, normalizedGrade, normalizedType, normalizedStatus, normalizedSearch))
                .collect(Collectors.toList());

        return slice(filtered, pageable);
    }

    @Override
    public SalaryPaymentDto create(SalaryPaymentDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (dto == null) throw new BadRequestException("Request body is required");

        Employee employee = resolveEmployee(dto.getEmployeeId());
        Long effectiveSchoolId = employee.getSchoolId();
        if (dto.getSchoolId() != null && !Objects.equals(dto.getSchoolId(), effectiveSchoolId)) {
            throw new BadRequestException("Employee does not belong to the selected school");
        }
        ensureUserCanWrite(user, effectiveSchoolId);

        SalaryGrade grade = resolveSalaryGrade(dto.getSalaryGradeId(), effectiveSchoolId, employee.getSalaryGrade());
        SalaryPayment entity = new SalaryPayment();
        applyDto(entity, dto, employee, grade, effectiveSchoolId);
        return toDto(salaryPaymentRepository.save(entity));
    }

    @Override
    public SalaryPaymentDto update(Long id, SalaryPaymentDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (dto == null) throw new BadRequestException("Request body is required");

        SalaryPayment entity = salaryPaymentRepository.findByIdAndDeletedFalse(id).orElseThrow(NotFoundException::new);
        Employee employee = resolveEmployee(dto.getEmployeeId() != null ? dto.getEmployeeId() : entity.getEmployeeId());
        Long effectiveSchoolId = employee.getSchoolId();
        if (dto.getSchoolId() != null && !Objects.equals(dto.getSchoolId(), effectiveSchoolId)) {
            throw new BadRequestException("Employee does not belong to the selected school");
        }
        ensureUserCanWrite(user, effectiveSchoolId);

        SalaryGrade grade = resolveSalaryGrade(
                dto.getSalaryGradeId() != null ? dto.getSalaryGradeId() : entity.getSalaryGradeId(),
                effectiveSchoolId,
                employee.getSalaryGrade()
        );
        applyDto(entity, dto, employee, grade, effectiveSchoolId);
        return toDto(salaryPaymentRepository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        SalaryPayment entity = salaryPaymentRepository.findByIdAndDeletedFalse(id).orElseThrow(NotFoundException::new);
        ensureUserCanRead(user, entity.getSchoolId());
        entity.setDeleted(true);
        salaryPaymentRepository.save(entity);
    }

    private List<SalaryPayment> fetchScopedRows(List<Long> scopedSchoolIds) {
        if (scopedSchoolIds == null) {
            return salaryPaymentRepository.findAllByDeletedFalseOrderByIdDesc();
        }
        if (scopedSchoolIds.isEmpty()) {
            return List.of();
        }
        if (scopedSchoolIds.size() == 1) {
            return salaryPaymentRepository.findBySchoolIdAndDeletedFalseOrderByIdDesc(scopedSchoolIds.get(0));
        }
        return salaryPaymentRepository.findBySchoolIdInAndDeletedFalseOrderByIdDesc(scopedSchoolIds);
    }

    private List<Long> resolveSchoolIds(CurrentUser user, Long requestedHeadOfficeId, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return List.of(user.schoolId());
        }

        if (user.isHeadOfficeScopedAdmin()) {
            Long effectiveHeadOfficeId = user.headOfficeId();
            if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, effectiveHeadOfficeId)) {
                throw new ForbiddenException();
            }
            if (requestedSchoolId != null) {
                ensureSchoolInHeadOffice(requestedSchoolId, effectiveHeadOfficeId);
                return List.of(requestedSchoolId);
            }
            return schoolRepository.findAllByIsDeletedFalseAndHeadOfficeId(effectiveHeadOfficeId)
                    .stream()
                    .map(ManageSchool::getId)
                    .toList();
        }

        if (user.isSuperAdmin()) {
            if (requestedSchoolId != null && requestedHeadOfficeId != null) {
                ensureSchoolInHeadOffice(requestedSchoolId, requestedHeadOfficeId);
                return List.of(requestedSchoolId);
            }
            if (requestedSchoolId != null) {
                return List.of(requestedSchoolId);
            }
            if (requestedHeadOfficeId != null) {
                return schoolRepository.findAllByIsDeletedFalseAndHeadOfficeId(requestedHeadOfficeId)
                        .stream()
                        .map(ManageSchool::getId)
                        .toList();
            }
            return null;
        }

        if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
        return List.of(requestedSchoolId);
    }

    private void ensureUserCanRead(CurrentUser user, Long schoolId) {
        resolveSchoolIds(user, null, schoolId);
    }

    private void ensureUserCanWrite(CurrentUser user, Long schoolId) {
        resolveSchoolIds(user, null, schoolId);
    }

    private void ensureSchoolInHeadOffice(Long schoolId, Long headOfficeId) {
        boolean ok = schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isPresent();
        if (!ok) throw new NotFoundException();
    }

    private Employee resolveEmployee(Long employeeId) {
        if (employeeId == null) throw new BadRequestException("employeeId is required");
        Employee employee = employeeRepository.findById(employeeId).orElseThrow(NotFoundException::new);
        if (employee.getSchoolId() == null) {
            throw new BadRequestException("Employee has no school assigned");
        }
        return employee;
    }

    private SalaryGrade resolveSalaryGrade(Long salaryGradeId, Long schoolId, String fallbackGradeName) {
        if (salaryGradeId != null) {
            SalaryGrade grade = salaryGradeRepository.findById(salaryGradeId).orElseThrow(NotFoundException::new);
            if (!Objects.equals(grade.getSchoolId(), schoolId)) {
                throw new BadRequestException("Salary grade does not belong to the selected school");
            }
            return grade;
        }

        String normalized = normalizeOptional(fallbackGradeName);
        if (normalized == null) return null;
        return salaryGradeRepository.findBySchoolIdAndGradeNameIgnoreCase(schoolId, normalized).orElse(null);
    }

    private void applyDto(SalaryPayment entity, SalaryPaymentDto dto, Employee employee, SalaryGrade grade, Long schoolId) {
        entity.setSchoolId(schoolId);
        entity.setSchoolName(resolveSchoolName(schoolId));
        entity.setEmployeeId(employee.getId());
        entity.setEmployeeName(employee.getName());
        entity.setSalaryType(normalizeOptional(employee.getSalaryType()));

        if (grade != null) {
            entity.setSalaryGradeId(grade.getId());
            entity.setGradeName(grade.getGradeName());
            entity.setBasicSalary(defaultValue(grade.getBasicSalary(), dto.getBasicSalary()));
            entity.setTotalAllowance(defaultValue(grade.getTotalAllowance(), dto.getTotalAllowance()));
            entity.setTotalDeduction(defaultValue(grade.getTotalDeduction(), dto.getTotalDeduction()));
            entity.setGrossSalary(defaultValue(grade.getGrossSalary(), dto.getGrossSalary()));
            entity.setNetSalary(defaultValue(grade.getNetSalary(), dto.getNetSalary()));
        } else {
            entity.setSalaryGradeId(dto.getSalaryGradeId());
            entity.setGradeName(normalizeOptional(dto.getGradeName()));
            entity.setBasicSalary(dto.getBasicSalary());
            entity.setTotalAllowance(dto.getTotalAllowance());
            entity.setTotalDeduction(dto.getTotalDeduction());
            entity.setGrossSalary(dto.getGrossSalary());
            entity.setNetSalary(dto.getNetSalary());
        }

        entity.setMonth(normalizeMonth(dto.getMonth(), dto.getPaymentDate()));
        entity.setPaymentDate(dto.getPaymentDate() != null ? dto.getPaymentDate() : LocalDate.now());
        entity.setPaymentMethod(normalizeRequired(dto.getPaymentMethod(), "Payment method is required"));
        entity.setStatus(normalizeOptional(dto.getStatus()) != null ? normalizeOptional(dto.getStatus()) : "Paid");
        entity.setNote(normalizeOptional(dto.getNote()));

        if (entity.getBasicSalary() == null) {
            entity.setBasicSalary(0D);
        }
        if (entity.getTotalAllowance() == null) {
            entity.setTotalAllowance(0D);
        }
        if (entity.getTotalDeduction() == null) {
            entity.setTotalDeduction(0D);
        }
        if (entity.getGrossSalary() == null) {
            entity.setGrossSalary((entity.getBasicSalary() == null ? 0D : entity.getBasicSalary()) + (entity.getTotalAllowance() == null ? 0D : entity.getTotalAllowance()));
        }
        if (entity.getNetSalary() == null) {
            entity.setNetSalary((entity.getGrossSalary() == null ? 0D : entity.getGrossSalary()) - (entity.getTotalDeduction() == null ? 0D : entity.getTotalDeduction()));
        }
    }

    private String normalizeMonth(String month, LocalDate paymentDate) {
        String normalized = normalizeOptional(month);
        if (normalized != null) return normalized;
        LocalDate effectiveDate = paymentDate != null ? paymentDate : LocalDate.now();
        return effectiveDate.format(MONTH_FORMATTER);
    }

    private String resolveSchoolName(Long schoolId) {
        if (schoolId == null) return null;
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .map(ManageSchool::getSchoolName)
                .orElse(null);
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

    private Double defaultValue(Double preferred, Double fallback) {
        return preferred != null ? preferred : fallback;
    }

    private Predicate<SalaryPaymentDto> matches(
            String month,
            String gradeName,
            String salaryType,
            String status,
            String search
    ) {
        String normalizedSearch = search == null ? null : search.toLowerCase();
        return dto -> {
            boolean matchesMonth = month == null || safe(dto.getMonth()).equalsIgnoreCase(month);
            boolean matchesGrade = gradeName == null || safe(dto.getGradeName()).equalsIgnoreCase(gradeName);
            boolean matchesType = salaryType == null || safe(dto.getSalaryType()).equalsIgnoreCase(salaryType);
            boolean matchesStatus = status == null || safe(dto.getStatus()).equalsIgnoreCase(status);
            boolean matchesSearch = normalizedSearch == null || String.join(" ",
                    safe(dto.getSchoolName()),
                    safe(dto.getEmployeeName()),
                    safe(dto.getGradeName()),
                    safe(dto.getMonth()),
                    safe(dto.getSalaryType()),
                    safe(dto.getPaymentMethod()),
                    safe(dto.getStatus()),
                    safe(dto.getNote()))
                    .toLowerCase()
                    .contains(normalizedSearch);
            return matchesMonth && matchesGrade && matchesType && matchesStatus && matchesSearch;
        };
    }

    private Page<SalaryPaymentDto> slice(List<SalaryPaymentDto> rows, Pageable pageable) {
        int start = Math.min(pageable.getPageNumber() * pageable.getPageSize(), rows.size());
        int end = Math.min(start + pageable.getPageSize(), rows.size());
        return new PageImpl<>(rows.subList(start, end), pageable, rows.size());
    }

    private SalaryPaymentDto toDto(SalaryPayment entity) {
        SalaryPaymentDto dto = new SalaryPaymentDto();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setSchoolName(entity.getSchoolName());
        dto.setEmployeeId(entity.getEmployeeId());
        dto.setEmployeeName(entity.getEmployeeName());
        dto.setSalaryGradeId(entity.getSalaryGradeId());
        dto.setGradeName(entity.getGradeName());
        dto.setSalaryType(entity.getSalaryType());
        dto.setMonth(entity.getMonth());
        dto.setPaymentDate(entity.getPaymentDate());
        dto.setPaymentMethod(entity.getPaymentMethod());
        dto.setBasicSalary(entity.getBasicSalary());
        dto.setTotalAllowance(entity.getTotalAllowance());
        dto.setTotalDeduction(entity.getTotalDeduction());
        dto.setGrossSalary(entity.getGrossSalary());
        dto.setNetSalary(entity.getNetSalary());
        dto.setStatus(entity.getStatus());
        dto.setNote(entity.getNote());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
