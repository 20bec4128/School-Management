package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.VehicleDto;
import com.School.School_management.Entity.Employee;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.Vehicle;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.EmployeeRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.VehicleRepository;
import com.School.School_management.Service.VehicleService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Transactional
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository repository;
    private final SchoolRepository schoolRepository;
    private final EmployeeRepository employeeRepository;

    public VehicleServiceImpl(VehicleRepository repository, SchoolRepository schoolRepository, EmployeeRepository employeeRepository) {
        this.repository = repository;
        this.schoolRepository = schoolRepository;
        this.employeeRepository = employeeRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleDto> list(Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (user.isSuperAdmin() && schoolId == null) {
            return repository.findAllActiveWithDetailsOrderByIdDesc().stream().map(this::toDto).collect(Collectors.toList());
        }
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
        return repository.findBySchoolIdActiveWithDetailsOrderByIdDesc(effectiveSchoolId).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VehicleDto> listPaginated(Long schoolId, String search, int page, int size) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedSearch = normalizeOptional(search);
        if (user.isSuperAdmin() && schoolId == null) {
            return repository.findPageWithDetails(null, normalizedSearch, pageable).map(this::toDto);
        }
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
        return repository.findPageWithDetails(effectiveSchoolId, normalizedSearch, pageable).map(this::toDto);
    }

    @Override
    public VehicleDto create(VehicleDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto == null ? null : dto.getSchoolId());

        Vehicle entity = new Vehicle();
        applyDto(entity, dto, effectiveSchoolId);
        return toDto(repository.save(entity));
    }

    @Override
    public VehicleDto update(Long id, VehicleDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Vehicle entity = repository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto == null ? null : dto.getSchoolId());
        if (!Objects.equals(entity.getSchool().getId(), effectiveSchoolId) && !user.isSuperAdmin()) throw new ForbiddenException();
        applyDto(entity, dto, effectiveSchoolId);
        return toDto(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Vehicle entity = repository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, entity.getSchool().getId());
        if (!Objects.equals(entity.getSchool().getId(), effectiveSchoolId) && !user.isSuperAdmin()) throw new ForbiddenException();
        entity.setDeleted(true);
        repository.save(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleDto getById(Long id) {
        Vehicle entity = repository.findByIdWithDetails(id).orElseThrow(NotFoundException::new);
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, entity.getSchool().getId());
        if (!Objects.equals(entity.getSchool().getId(), effectiveSchoolId) && !user.isSuperAdmin()) throw new ForbiddenException();
        return toDto(entity);
    }

    private void applyDto(Vehicle entity, VehicleDto dto, Long schoolId) {
        if (dto == null) throw new BadRequestException("Vehicle data is required");
        entity.setSchool(resolveSchool(schoolId));
        entity.setDriverEmployee(resolveDriverEmployee(dto.getDriverEmployeeId(), schoolId));
        entity.setVehicleNumber(required(dto.getVehicleNumber(), "Vehicle number is required"));
        entity.setVehicleModel(normalizeOptional(dto.getVehicleModel()));
        entity.setVehicleLicense(normalizeOptional(dto.getVehicleLicense()));
        entity.setVehicleContactCountryCode(required(dto.getVehicleContactCountryCode(), "Vehicle contact country code is required"));
        entity.setVehicleContactNumber(required(dto.getVehicleContactNumber(), "Vehicle contact number is required"));
        entity.setNote(normalizeOptional(dto.getNote()));
    }

    private Employee resolveDriverEmployee(Long driverEmployeeId, Long schoolId) {
        if (driverEmployeeId == null) throw new BadRequestException("Driver is required");
        Employee employee = employeeRepository.findById(driverEmployeeId).orElseThrow(NotFoundException::new);
        if (!Objects.equals(employee.getSchoolId(), schoolId)) throw new ForbiddenException();
        if (employee.getRole() == null || !"DRIVER".equalsIgnoreCase(employee.getRole().trim())) {
            throw new BadRequestException("Selected employee is not a driver");
        }
        return employee;
    }

    private ManageSchool resolveSchool(Long schoolId) {
        return schoolRepository.findById(schoolId).orElseThrow(NotFoundException::new);
    }

    private Long effectiveSchoolIdForRead(CurrentUser user, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return user.schoolId();
        }
        if (user.isHeadOfficeScopedAdmin()) {
            if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
            ensureSchoolInHeadOffice(requestedSchoolId, user.headOfficeId());
            return requestedSchoolId;
        }
        if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
        return requestedSchoolId;
    }

    private Long effectiveSchoolIdForWrite(CurrentUser user, Long requestedSchoolId) {
        return effectiveSchoolIdForRead(user, requestedSchoolId);
    }

    private void ensureSchoolInHeadOffice(Long schoolId, Long headOfficeId) {
        if (!schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isPresent()) {
            throw new NotFoundException();
        }
    }

    private VehicleDto toDto(Vehicle entity) {
        VehicleDto dto = new VehicleDto();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchool() == null ? null : entity.getSchool().getId());
        dto.setSchoolName(entity.getSchool() == null ? null : entity.getSchool().getSchoolName());
        dto.setDriverEmployeeId(entity.getDriverEmployee() == null ? null : entity.getDriverEmployee().getId());
        dto.setDriverEmployeeName(entity.getDriverEmployee() == null ? null : entity.getDriverEmployee().getName());
        dto.setVehicleNumber(entity.getVehicleNumber());
        dto.setVehicleModel(entity.getVehicleModel());
        dto.setVehicleLicense(entity.getVehicleLicense());
        dto.setVehicleContactCountryCode(entity.getVehicleContactCountryCode());
        dto.setVehicleContactNumber(entity.getVehicleContactNumber());
        dto.setNote(entity.getNote());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
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
}
