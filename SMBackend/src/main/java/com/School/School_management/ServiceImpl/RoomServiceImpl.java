package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.RoomDto;
import com.School.School_management.Entity.Hostel;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.Room;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.HostelRepository;
import com.School.School_management.Repository.RoomRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.RoomService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Transactional
public class RoomServiceImpl implements RoomService {

    private final RoomRepository repository;
    private final SchoolRepository schoolRepository;
    private final HostelRepository hostelRepository;

    public RoomServiceImpl(RoomRepository repository, SchoolRepository schoolRepository, HostelRepository hostelRepository) {
        this.repository = repository;
        this.schoolRepository = schoolRepository;
        this.hostelRepository = hostelRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomDto> list(Long headOfficeId, Long schoolId, Long hostelId, String roomType) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Scope scope = resolveScopeForRead(user, headOfficeId, schoolId);
        return repository.findByFilters(scope.headOfficeId, scope.schoolId, hostelId, normalizeOptional(roomType))
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RoomDto> listPaginated(Long headOfficeId, Long schoolId, Long hostelId, String roomType, String search, int page, int size) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Scope scope = resolveScopeForRead(user, headOfficeId, schoolId);
        return repository.findPageWithDetails(scope.headOfficeId, scope.schoolId, hostelId, normalizeOptional(roomType), normalizeOptional(search), pageable).map(this::toDto);
    }

    @Override
    public RoomDto create(RoomDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Scope scope = resolveScopeForWrite(user, dto == null ? null : dto.getHeadOfficeId(), dto == null ? null : dto.getSchoolId());
        Room entity = new Room();
        applyDto(entity, dto, scope.headOfficeId, scope.schoolId);
        return toDto(repository.save(entity));
    }

    @Override
    public RoomDto update(Long id, RoomDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Room entity = repository.findById(id).orElseThrow(NotFoundException::new);
        Scope scope = resolveScopeForWrite(user, dto == null ? null : dto.getHeadOfficeId(), dto == null ? null : dto.getSchoolId());
        if (!Objects.equals(entity.getSchool().getId(), scope.schoolId) && !user.isSuperAdmin()) throw new ForbiddenException();
        applyDto(entity, dto, scope.headOfficeId, scope.schoolId);
        return toDto(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Room entity = repository.findById(id).orElseThrow(NotFoundException::new);
        Scope scope = resolveScopeForRead(user, entity.getHeadOfficeId(), entity.getSchool() == null ? null : entity.getSchool().getId());
        if (!Objects.equals(entity.getSchool().getId(), scope.schoolId) && !user.isSuperAdmin()) throw new ForbiddenException();
        entity.setDeleted(true);
        repository.save(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public RoomDto getById(Long id) {
        Room entity = repository.findByIdWithDetails(id).orElseThrow(NotFoundException::new);
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Scope scope = resolveScopeForRead(user, entity.getHeadOfficeId(), entity.getSchool() == null ? null : entity.getSchool().getId());
        if (!Objects.equals(entity.getSchool().getId(), scope.schoolId) && !user.isSuperAdmin()) throw new ForbiddenException();
        return toDto(entity);
    }

    private void applyDto(Room entity, RoomDto dto, Long headOfficeId, Long schoolId) {
        if (dto == null) throw new BadRequestException("Room data is required");
        ManageSchool school = resolveSchool(schoolId);
        Hostel hostel = resolveHostel(dto.getHostelId(), school.getId());
        Long effectiveHeadOfficeId = resolveHeadOfficeId(school, headOfficeId);
        entity.setHeadOfficeId(effectiveHeadOfficeId);
        entity.setSchool(school);
        entity.setHostel(hostel);
        entity.setRoomNo(required(dto.getRoomNo(), "Room no is required"));
        entity.setRoomType(required(dto.getRoomType(), "Room type is required"));
        entity.setSeatTotal(requiredSeatTotal(dto.getSeatTotal()));
        entity.setCostPerSeat(normalizeOptionalBigDecimal(dto.getCostPerSeat()));
        entity.setNote(normalizeOptional(dto.getNote()));
    }

    private ManageSchool resolveSchool(Long schoolId) {
        if (schoolId == null) throw new BadRequestException("schoolId is required");
        return schoolRepository.findById(schoolId).orElseThrow(NotFoundException::new);
    }

    private Hostel resolveHostel(Long hostelId, Long schoolId) {
        if (hostelId == null) throw new BadRequestException("hostelId is required");
        Hostel hostel = hostelRepository.findByIdWithDetails(hostelId).orElseThrow(NotFoundException::new);
        if (hostel.getSchool() == null || !Objects.equals(hostel.getSchool().getId(), schoolId)) {
            throw new BadRequestException("Selected hostel does not belong to the selected school");
        }
        return hostel;
    }

    private Long resolveHeadOfficeId(ManageSchool school, Long requestedHeadOfficeId) {
        Long schoolHeadOfficeId = school.getHeadOfficeId();
        if (schoolHeadOfficeId == null && requestedHeadOfficeId == null) {
            throw new BadRequestException("headOfficeId is required");
        }
        if (requestedHeadOfficeId != null && schoolHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, schoolHeadOfficeId)) {
            throw new BadRequestException("Selected school does not belong to the requested head office");
        }
        return schoolHeadOfficeId != null ? schoolHeadOfficeId : requestedHeadOfficeId;
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

    private RoomDto toDto(Room entity) {
        RoomDto dto = new RoomDto();
        dto.setId(entity.getId());
        dto.setHeadOfficeId(entity.getHeadOfficeId());
        dto.setSchoolId(entity.getSchool() == null ? null : entity.getSchool().getId());
        dto.setSchoolName(entity.getSchool() == null ? null : entity.getSchool().getSchoolName());
        dto.setHostelId(entity.getHostel() == null ? null : entity.getHostel().getId());
        dto.setHostelName(entity.getHostel() == null ? null : entity.getHostel().getName());
        dto.setRoomNo(entity.getRoomNo());
        dto.setRoomType(entity.getRoomType());
        dto.setSeatTotal(entity.getSeatTotal());
        dto.setCostPerSeat(entity.getCostPerSeat());
        dto.setNote(entity.getNote());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    private String required(String value, String message) {
        String trimmed = normalizeOptional(value);
        if (trimmed == null) throw new BadRequestException(message);
        return trimmed;
    }

    private Integer requiredSeatTotal(Integer value) {
        if (value == null || value <= 0) throw new BadRequestException("Seat total is required");
        return value;
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private BigDecimal normalizeOptionalBigDecimal(BigDecimal value) {
        return value;
    }

    private record Scope(Long headOfficeId, Long schoolId) {}
}
