package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.WarehouseDto;
import com.School.School_management.Entity.Employee;
import com.School.School_management.Entity.HeadOffice;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.Warehouse;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.HeadOfficeRepository;
import com.School.School_management.Repository.EmployeeRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.WarehouseRepository;
import com.School.School_management.Service.WarehouseService;
import com.School.School_management.auth.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@Transactional
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final SchoolRepository schoolRepository;
    private final HeadOfficeRepository headOfficeRepository;
    private final EmployeeRepository employeeRepository;

    public WarehouseServiceImpl(
            WarehouseRepository warehouseRepository,
            SchoolRepository schoolRepository,
            HeadOfficeRepository headOfficeRepository,
            EmployeeRepository employeeRepository
    ) {
        this.warehouseRepository = warehouseRepository;
        this.schoolRepository = schoolRepository;
        this.headOfficeRepository = headOfficeRepository;
        this.employeeRepository = employeeRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WarehouseDto> list(Long headOfficeId, Long schoolId, String search, int page, int size, CurrentUser user) {
        ResolvedScope scope = resolveListScope(user, headOfficeId, schoolId);
        String normalizedSearch = normalizeSearch(search);
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id"));
        return warehouseRepository.searchWarehouses(scope.headOfficeId(), scope.schoolId(), normalizedSearch, pageable).map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public WarehouseDto getById(Long id, CurrentUser user) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        ensureVisibleToUser(warehouse, user);
        return toDto(warehouse);
    }

    @Override
    public WarehouseDto create(WarehouseDto dto, CurrentUser user) {
        ResolvedScope scope = resolveWriteScope(user, dto);
        Warehouse warehouse = new Warehouse();
        applyDto(dto, warehouse);
        warehouse.setHeadOfficeId(scope.headOfficeId());
        warehouse.setSchoolId(scope.schoolId());
        return toDto(warehouseRepository.save(warehouse));
    }

    @Override
    public WarehouseDto update(Long id, WarehouseDto dto, CurrentUser user) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        ensureVisibleToUser(warehouse, user);
        ResolvedScope scope = resolveWriteScope(user, dto);
        applyDto(dto, warehouse);
        warehouse.setHeadOfficeId(scope.headOfficeId());
        warehouse.setSchoolId(scope.schoolId());
        return toDto(warehouseRepository.save(warehouse));
    }

    @Override
    public void delete(Long id, CurrentUser user) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        ensureVisibleToUser(warehouse, user);
        warehouseRepository.delete(warehouse);
    }

    private void ensureVisibleToUser(Warehouse warehouse, CurrentUser user) {
        if (user == null) throw new ForbiddenException();
        if (user.isSuperAdmin()) return;
        if (user.isHeadOfficeScopedAdmin()) {
            if (!Objects.equals(user.headOfficeId(), warehouse.getHeadOfficeId())) throw new NotFoundException();
            return;
        }
        if (user.isSchoolScopedAdminUser()) {
            if (!Objects.equals(user.schoolId(), warehouse.getSchoolId())) throw new NotFoundException();
            return;
        }
        throw new ForbiddenException();
    }

    private ResolvedScope resolveListScope(CurrentUser user, Long requestedHeadOfficeId, Long requestedSchoolId) {
        if (user == null) throw new ForbiddenException();

        if (user.isSuperAdmin()) {
            if (requestedSchoolId != null) {
                ManageSchool school = requireSchool(requestedSchoolId);
                if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
                    throw new BadRequestException("School does not belong to the selected head office");
                }
                return new ResolvedScope(school.getHeadOfficeId(), school.getId());
            }
            return new ResolvedScope(normalizeId(requestedHeadOfficeId), null);
        }

        if (user.isHeadOfficeScopedAdmin()) {
            Long authHeadOfficeId = user.headOfficeId();
            if (requestedHeadOfficeId != null && !Objects.equals(authHeadOfficeId, requestedHeadOfficeId)) {
                throw new ForbiddenException();
            }
            if (requestedSchoolId != null) {
                ManageSchool school = requireSchool(requestedSchoolId);
                if (!Objects.equals(authHeadOfficeId, school.getHeadOfficeId())) {
                    throw new BadRequestException("School does not belong to your head office");
                }
                return new ResolvedScope(authHeadOfficeId, school.getId());
            }
            return new ResolvedScope(authHeadOfficeId, null);
        }

        if (user.isSchoolScopedAdminUser()) {
            Long authSchoolId = user.schoolId();
            if (authSchoolId == null) throw new ForbiddenException();
            ManageSchool school = requireSchool(authSchoolId);
            if (requestedSchoolId != null && !Objects.equals(requestedSchoolId, authSchoolId)) {
                throw new ForbiddenException();
            }
            if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
                throw new ForbiddenException();
            }
            return new ResolvedScope(school.getHeadOfficeId(), authSchoolId);
        }

        throw new ForbiddenException();
    }

    private ResolvedScope resolveWriteScope(CurrentUser user, WarehouseDto dto) {
        if (user == null) throw new ForbiddenException();

        Long requestedHeadOfficeId = normalizeId(dto == null ? null : dto.getHeadOfficeId());
        Long requestedSchoolId = normalizeId(dto == null ? null : dto.getSchoolId());

        if (user.isSuperAdmin()) {
            ManageSchool school = requireSchool(requiredId(requestedSchoolId, "School is required"));
            if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
                throw new BadRequestException("School does not belong to the selected head office");
            }
            return new ResolvedScope(school.getHeadOfficeId(), school.getId());
        }

        if (user.isHeadOfficeScopedAdmin()) {
            Long authHeadOfficeId = user.headOfficeId();
            ManageSchool school = requireSchool(requiredId(requestedSchoolId, "School is required"));
            if (!Objects.equals(authHeadOfficeId, school.getHeadOfficeId())) {
                throw new BadRequestException("School does not belong to your head office");
            }
            if (requestedHeadOfficeId != null && !Objects.equals(authHeadOfficeId, requestedHeadOfficeId)) {
                throw new ForbiddenException();
            }
            return new ResolvedScope(authHeadOfficeId, school.getId());
        }

        if (user.isSchoolScopedAdminUser()) {
            Long authSchoolId = user.schoolId();
            if (authSchoolId == null) throw new ForbiddenException();
            ManageSchool school = requireSchool(authSchoolId);
            if (requestedSchoolId != null && !Objects.equals(requestedSchoolId, authSchoolId)) {
                throw new ForbiddenException();
            }
            if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
                throw new ForbiddenException();
            }
            return new ResolvedScope(school.getHeadOfficeId(), authSchoolId);
        }

        throw new ForbiddenException();
    }

    private void applyDto(WarehouseDto dto, Warehouse warehouse) {
        if (dto == null) throw new BadRequestException("Warehouse data is required");
        warehouse.setWarehouseName(required(dto.getWarehouseName(), "Warehouse name is required"));
        WarehouseKeeper keeper = resolveWarehouseKeeper(dto.getSchoolId(), dto.getWarehouseKeeperId(), dto.getWarehouseKeeper());
        warehouse.setWarehouseKeeper(keeper.name());
        warehouse.setWarehouseKeeperId(keeper.id());
        warehouse.setEmail(normalizeOptional(dto.getEmail()));
        warehouse.setPhone(normalizeOptional(dto.getPhone()));
        warehouse.setAddress(normalizeOptional(dto.getAddress()));
        warehouse.setNote(normalizeOptional(dto.getNote()));
    }

    private ManageSchool requireSchool(Long schoolId) {
        if (schoolId == null) throw new BadRequestException("schoolId is required");
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .orElseThrow(NotFoundException::new);
    }

    private Long requiredId(Long value, String message) {
        if (value == null) throw new BadRequestException(message);
        return value;
    }

    private Long normalizeId(Long value) {
        return value == null || value <= 0 ? null : value;
    }

    private String normalizeSearch(String search) {
        String value = search == null ? "" : search.trim();
        return value.isEmpty() ? null : value;
    }

    private String required(String value, String message) {
        String trimmed = normalizeOptional(value);
        if (trimmed == null) throw new BadRequestException(message);
        return trimmed;
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private WarehouseDto toDto(Warehouse warehouse) {
        WarehouseDto dto = new WarehouseDto();
        dto.setId(warehouse.getId());
        dto.setHeadOfficeId(warehouse.getHeadOfficeId());
        dto.setHeadOfficeName(resolveHeadOfficeName(warehouse.getHeadOfficeId()));
        dto.setSchoolId(warehouse.getSchoolId());
        dto.setSchoolName(resolveSchoolName(warehouse.getSchoolId()));
        dto.setWarehouseName(warehouse.getWarehouseName());
        dto.setWarehouseKeeper(warehouse.getWarehouseKeeper());
        dto.setWarehouseKeeperId(warehouse.getWarehouseKeeperId());
        dto.setEmail(warehouse.getEmail());
        dto.setPhone(warehouse.getPhone());
        dto.setAddress(warehouse.getAddress());
        dto.setNote(warehouse.getNote());
        dto.setCreatedAt(warehouse.getCreatedAt());
        dto.setUpdatedAt(warehouse.getUpdatedAt());
        return dto;
    }

    private String resolveHeadOfficeName(Long headOfficeId) {
        if (headOfficeId == null) return null;
        return headOfficeRepository.findById(headOfficeId)
                .map(HeadOffice::getName)
                .orElse("Head Office " + headOfficeId);
    }

    private String resolveSchoolName(Long schoolId) {
        if (schoolId == null) return null;
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .map(ManageSchool::getSchoolName)
                .orElse("School " + schoolId);
    }

    private WarehouseKeeper resolveWarehouseKeeper(Long schoolId, Long warehouseKeeperId, String fallbackName) {
        if (warehouseKeeperId != null) {
            Employee employee = employeeRepository.findById(warehouseKeeperId).orElseThrow(NotFoundException::new);
            if (employee.getSchoolId() == null || !Objects.equals(employee.getSchoolId(), schoolId)) {
                throw new BadRequestException("Warehouse keeper does not belong to the selected school");
            }
            String role = normalizeOptional(employee.getRole());
            if (role == null || !"WAREHOUSE_KEEPER".equalsIgnoreCase(role)) {
                throw new BadRequestException("Selected employee is not a warehouse keeper");
            }
            return new WarehouseKeeper(employee.getId(), employee.getName());
        }

        String keeperName = normalizeOptional(fallbackName);
        return new WarehouseKeeper(null, keeperName);
    }

    private record WarehouseKeeper(Long id, String name) {
    }

    private record ResolvedScope(Long headOfficeId, Long schoolId) {
    }
}
