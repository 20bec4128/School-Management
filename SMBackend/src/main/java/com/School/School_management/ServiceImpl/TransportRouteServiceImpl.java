package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.TransportRouteDto;
import com.School.School_management.Dto.TransportRouteStopDto;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.TransportRoute;
import com.School.School_management.Entity.TransportRouteStop;
import com.School.School_management.Entity.Vehicle;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.TransportRouteRepository;
import com.School.School_management.Repository.VehicleRepository;
import com.School.School_management.Service.TransportRouteService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Transactional
public class TransportRouteServiceImpl implements TransportRouteService {

    private final TransportRouteRepository repository;
    private final SchoolRepository schoolRepository;
    private final VehicleRepository vehicleRepository;

    public TransportRouteServiceImpl(TransportRouteRepository repository, SchoolRepository schoolRepository, VehicleRepository vehicleRepository) {
        this.repository = repository;
        this.schoolRepository = schoolRepository;
        this.vehicleRepository = vehicleRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransportRouteDto> list(Long headOfficeId, Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Scope scope = resolveScopeForRead(user, headOfficeId, schoolId);
        if (scope.schoolId == null && scope.headOfficeId == null) {
            return repository.findAllActiveWithDetailsOrderByIdDesc().stream().map(this::toDto).collect(Collectors.toList());
        }
        if (scope.schoolId != null) {
            return repository.findBySchoolIdActiveWithDetailsOrderByIdDesc(scope.schoolId).stream().map(this::toDto).collect(Collectors.toList());
        }
        return repository.findByHeadOfficeIdActiveWithDetailsOrderByIdDesc(scope.headOfficeId).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransportRouteDto> listPaginated(Long headOfficeId, Long schoolId, String search, int page, int size) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Scope scope = resolveScopeForRead(user, headOfficeId, schoolId);
        return repository.findPageWithDetails(scope.headOfficeId, scope.schoolId, normalizeOptional(search), pageable).map(this::toDto);
    }

    @Override
    public TransportRouteDto create(TransportRouteDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Scope scope = resolveScopeForWrite(user, dto == null ? null : dto.getHeadOfficeId(), dto == null ? null : dto.getSchoolId());

        TransportRoute entity = new TransportRoute();
        applyDto(entity, dto, scope.headOfficeId, scope.schoolId);
        return toDto(repository.save(entity));
    }

    @Override
    public TransportRouteDto update(Long id, TransportRouteDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        TransportRoute entity = repository.findById(id).orElseThrow(NotFoundException::new);
        Scope scope = resolveScopeForWrite(user, dto == null ? null : dto.getHeadOfficeId(), dto == null ? null : dto.getSchoolId());
        if (!Objects.equals(entity.getSchool().getId(), scope.schoolId) && !user.isSuperAdmin()) throw new ForbiddenException();
        applyDto(entity, dto, scope.headOfficeId, scope.schoolId);
        return toDto(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        TransportRoute entity = repository.findById(id).orElseThrow(NotFoundException::new);
        Scope scope = resolveScopeForRead(user, entity.getHeadOfficeId(), entity.getSchool() == null ? null : entity.getSchool().getId());
        if (!Objects.equals(entity.getSchool().getId(), scope.schoolId) && !user.isSuperAdmin()) throw new ForbiddenException();
        entity.setDeleted(true);
        repository.save(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public TransportRouteDto getById(Long id) {
        TransportRoute entity = repository.findByIdWithDetails(id).orElseThrow(NotFoundException::new);
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Scope scope = resolveScopeForRead(user, entity.getHeadOfficeId(), entity.getSchool() == null ? null : entity.getSchool().getId());
        if (!Objects.equals(entity.getSchool().getId(), scope.schoolId) && !user.isSuperAdmin()) throw new ForbiddenException();
        return toDto(entity);
    }

    private void applyDto(TransportRoute entity, TransportRouteDto dto, Long headOfficeId, Long schoolId) {
        if (dto == null) throw new BadRequestException("Transport route data is required");
        ManageSchool school = resolveSchool(schoolId);
        Long effectiveHeadOfficeId = resolveHeadOfficeId(school, headOfficeId);
        Vehicle vehicle = resolveVehicle(dto.getVehicleId(), schoolId);

        entity.setHeadOfficeId(effectiveHeadOfficeId);
        entity.setSchool(school);
        entity.setVehicle(vehicle);
        entity.setRouteName(required(dto.getRouteName(), "Route name is required"));
        entity.setRouteStart(required(dto.getRouteStart(), "Route start is required"));
        entity.setRouteEnd(required(dto.getRouteEnd(), "Route end is required"));
        entity.setNote(normalizeOptional(dto.getNote()));
        syncStops(entity, dto.getStops());
    }

    private void syncStops(TransportRoute entity, List<TransportRouteStopDto> stopDtos) {
        List<TransportRouteStop> stops = new ArrayList<>();
        List<TransportRouteStopDto> rows = stopDtos == null ? List.of() : stopDtos;
        int order = 1;
        for (TransportRouteStopDto stopDto : rows) {
            if (stopDto == null) continue;
            String stopName = normalizeOptional(stopDto.getStopName());
            BigDecimal stopKm = stopDto.getStopKm();
            BigDecimal stopFare = stopDto.getStopFare();
            if (stopName == null && stopKm == null && stopFare == null) {
                continue;
            }
            if (stopName == null) {
                continue;
            }
            TransportRouteStop stop = new TransportRouteStop();
            stop.setRoute(entity);
            stop.setStopOrder(order++);
            stop.setStopName(stopName);
            stop.setStopKm(stopKm);
            stop.setStopFare(stopFare);
            stops.add(stop);
        }
        entity.getStops().clear();
        entity.getStops().addAll(stops);
    }

    private Vehicle resolveVehicle(Long vehicleId, Long schoolId) {
        if (vehicleId == null) throw new BadRequestException("Vehicle is required");
        Vehicle vehicle = vehicleRepository.findById(vehicleId).orElseThrow(NotFoundException::new);
        if (!Objects.equals(vehicle.getSchool() == null ? null : vehicle.getSchool().getId(), schoolId)) {
            throw new BadRequestException("Selected vehicle does not belong to the selected school");
        }
        return vehicle;
    }

    private Long resolveHeadOfficeId(ManageSchool school, Long requestedHeadOfficeId) {
        Long schoolHeadOfficeId = school.getHeadOfficeId();
        if (requestedHeadOfficeId != null && schoolHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, schoolHeadOfficeId)) {
            throw new BadRequestException("Selected school does not belong to the requested head office");
        }
        return schoolHeadOfficeId != null ? schoolHeadOfficeId : requestedHeadOfficeId;
    }

    private ManageSchool resolveSchool(Long schoolId) {
        if (schoolId == null) throw new BadRequestException("schoolId is required");
        return schoolRepository.findById(schoolId).orElseThrow(NotFoundException::new);
    }

    private Scope resolveScopeForRead(CurrentUser user, Long requestedHeadOfficeId, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return new Scope(null, user.schoolId());
        }
        if (user.isHeadOfficeScopedAdmin()) {
            if (requestedSchoolId != null) {
                ensureSchoolInHeadOffice(requestedSchoolId, user.headOfficeId());
                return new Scope(user.headOfficeId(), requestedSchoolId);
            }
            Long effectiveHeadOfficeId = requestedHeadOfficeId != null ? requestedHeadOfficeId : user.headOfficeId();
            if (effectiveHeadOfficeId == null) throw new BadRequestException("headOfficeId is required");
            if (!Objects.equals(effectiveHeadOfficeId, user.headOfficeId())) throw new ForbiddenException();
            return new Scope(effectiveHeadOfficeId, null);
        }
        return new Scope(requestedHeadOfficeId, requestedSchoolId);
    }

    private Scope resolveScopeForWrite(CurrentUser user, Long requestedHeadOfficeId, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return new Scope(null, user.schoolId());
        }
        if (user.isHeadOfficeScopedAdmin()) {
            if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
            ensureSchoolInHeadOffice(requestedSchoolId, user.headOfficeId());
            return new Scope(user.headOfficeId(), requestedSchoolId);
        }
        if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
        return new Scope(requestedHeadOfficeId, requestedSchoolId);
    }

    private void ensureSchoolInHeadOffice(Long schoolId, Long headOfficeId) {
        if (!schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isPresent()) {
            throw new NotFoundException();
        }
    }

    private TransportRouteDto toDto(TransportRoute entity) {
        TransportRouteDto dto = new TransportRouteDto();
        dto.setId(entity.getId());
        dto.setHeadOfficeId(entity.getHeadOfficeId());
        dto.setSchoolId(entity.getSchool() == null ? null : entity.getSchool().getId());
        dto.setSchoolName(entity.getSchool() == null ? null : entity.getSchool().getSchoolName());
        dto.setVehicleId(entity.getVehicle() == null ? null : entity.getVehicle().getId());
        dto.setVehicleNumber(entity.getVehicle() == null ? null : entity.getVehicle().getVehicleNumber());
        dto.setVehicleModel(entity.getVehicle() == null ? null : entity.getVehicle().getVehicleModel());
        dto.setVehicleName(buildVehicleName(entity.getVehicle()));
        dto.setRouteName(entity.getRouteName());
        dto.setRouteStart(entity.getRouteStart());
        dto.setRouteEnd(entity.getRouteEnd());
        dto.setNote(entity.getNote());
        dto.setStops(entity.getStops() == null
                ? List.of()
                : entity.getStops().stream().map(this::toStopDto).collect(Collectors.toList()));
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    private TransportRouteStopDto toStopDto(TransportRouteStop entity) {
        TransportRouteStopDto dto = new TransportRouteStopDto();
        dto.setId(entity.getId());
        dto.setStopOrder(entity.getStopOrder());
        dto.setStopName(entity.getStopName());
        dto.setStopKm(entity.getStopKm());
        dto.setStopFare(entity.getStopFare());
        return dto;
    }

    private String buildVehicleName(Vehicle vehicle) {
        if (vehicle == null) return null;
        String number = normalizeOptional(vehicle.getVehicleNumber());
        String model = normalizeOptional(vehicle.getVehicleModel());
        if (number != null && model != null) return number + " - " + model;
        if (number != null) return number;
        return model;
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

    private record Scope(Long headOfficeId, Long schoolId) {}
}
