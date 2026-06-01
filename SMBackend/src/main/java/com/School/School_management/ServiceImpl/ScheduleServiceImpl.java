package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.ScheduleDto;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.Schedule;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.ScheduleRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.ScheduleService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.util.List;
import java.util.Objects;
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
public class ScheduleServiceImpl implements ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final SchoolRepository schoolRepository;

    public ScheduleServiceImpl(ScheduleRepository scheduleRepository, SchoolRepository schoolRepository) {
        this.scheduleRepository = scheduleRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScheduleDto> list(Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        return resolveVisibleRows(user, schoolId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ScheduleDto> listPaginated(Long schoolId, int page, int size, String search) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("examDate").ascending().and(Sort.by("startTime").ascending()));
        String normalizedSearch = normalizeOptional(search);

        List<ScheduleDto> rows = list(schoolId).stream()
                .filter(dto -> normalizedSearch == null || matchesSearch(dto, normalizedSearch))
                .collect(Collectors.toList());
        return slice(rows, pageable);
    }

    @Override
    public ScheduleDto create(ScheduleDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Schedule schedule = convertToEntity(dto);
        schedule.setSchoolId(resolveSchoolIdForWrite(user, dto == null ? null : dto.getSchoolId()));
        Schedule saved = scheduleRepository.save(schedule);
        return convertToDto(saved);
    }

    @Override
    public ScheduleDto update(Long id, ScheduleDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (dto == null) throw new BadRequestException("Schedule data is required");

        Schedule existing = scheduleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException());

        Long effectiveSchoolId = resolveSchoolIdForWrite(user, dto == null || dto.getSchoolId() == null ? existing.getSchoolId() : dto.getSchoolId());
        if (!canAccessSchool(user, existing.getSchoolId()) || !Objects.equals(existing.getSchoolId(), effectiveSchoolId)) {
            throw new ForbiddenException();
        }

        existing.setSchoolId(effectiveSchoolId);
        existing.setExamTerm(dto.getExamTerm());
        existing.setClassName(dto.getClassName());
        existing.setSubjectName(dto.getSubjectName());
        existing.setExamDate(dto.getExamDate());
        existing.setStartTime(dto.getStartTime());
        existing.setEndTime(dto.getEndTime());
        existing.setRoomNo(dto.getRoomNo());
        existing.setNote(dto.getNote());

        Schedule updated = scheduleRepository.save(existing);
        return convertToDto(updated);
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Schedule existing = scheduleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException());
        if (!canAccessSchool(user, existing.getSchoolId())) {
            throw new ForbiddenException();
        }
        scheduleRepository.delete(existing);
    }

    @Override
    @Transactional(readOnly = true)
    public ScheduleDto findById(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException());
        if (!canAccessSchool(user, schedule.getSchoolId())) {
            throw new ForbiddenException();
        }
        return convertToDto(schedule);
    }

    private List<Schedule> resolveVisibleRows(CurrentUser user, Long schoolId) {
        List<Schedule> allRows = scheduleRepository.findAll(Sort.by("id").descending());

        if (user.isSchoolScoped()) {
            Long effectiveSchoolId = user.schoolId();
            if (effectiveSchoolId == null) throw new ForbiddenException();
            if (schoolId != null && !Objects.equals(schoolId, effectiveSchoolId)) throw new ForbiddenException();
            return allRows.stream()
                    .filter(row -> Objects.equals(row.getSchoolId(), effectiveSchoolId))
                    .collect(Collectors.toList());
        }

        if (user.isHeadOfficeScopedAdmin()) {
            Long effectiveHeadOfficeId = user.headOfficeId();
            if (schoolId != null) {
                ensureSchoolInHeadOffice(schoolId, effectiveHeadOfficeId);
                return allRows.stream()
                        .filter(row -> Objects.equals(row.getSchoolId(), schoolId))
                        .collect(Collectors.toList());
            }
            return allRows.stream()
                    .filter(row -> Objects.equals(resolveSchoolHeadOfficeId(row.getSchoolId()), effectiveHeadOfficeId))
                    .collect(Collectors.toList());
        }

        if (user.isSuperAdmin()) {
            if (schoolId != null) {
                return allRows.stream()
                        .filter(row -> Objects.equals(row.getSchoolId(), schoolId))
                        .collect(Collectors.toList());
            }
            return allRows;
        }

        if (schoolId == null) throw new BadRequestException("schoolId is required");
        return allRows.stream()
                .filter(row -> Objects.equals(row.getSchoolId(), schoolId))
                .collect(Collectors.toList());
    }

    private Long resolveSchoolIdForWrite(CurrentUser user, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return user.schoolId();
        }

        if (user.isHeadOfficeScopedAdmin()) {
            if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
            ensureSchoolInHeadOffice(requestedSchoolId, user.headOfficeId());
            return requestedSchoolId;
        }

        if (user.isSuperAdmin()) {
            if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
            return requestedSchoolId;
        }

        throw new ForbiddenException();
    }

    private void ensureSchoolInHeadOffice(Long schoolId, Long headOfficeId) {
        boolean ok = schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isPresent();
        if (!ok) throw new NotFoundException();
    }

    private boolean canAccessSchool(CurrentUser user, Long schoolId) {
        if (user.isSuperAdmin()) return true;
        if (schoolId == null) return false;
        if (user.isSchoolScoped()) {
            return Objects.equals(user.schoolId(), schoolId);
        }
        if (user.isHeadOfficeScopedAdmin()) {
            return Objects.equals(resolveSchoolHeadOfficeId(schoolId), user.headOfficeId());
        }
        return false;
    }

    private Long resolveSchoolHeadOfficeId(Long schoolId) {
        if (schoolId == null) return null;
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .map(ManageSchool::getHeadOfficeId)
                .orElse(null);
    }

    private ScheduleDto convertToDto(Schedule entity) {
        return ScheduleDto.builder()
                .id(entity.getId())
                .schoolId(entity.getSchoolId())
                .examTerm(entity.getExamTerm())
                .className(entity.getClassName())
                .subjectName(entity.getSubjectName())
                .examDate(entity.getExamDate())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .roomNo(entity.getRoomNo())
                .note(entity.getNote())
                .build();
    }

    private Schedule convertToEntity(ScheduleDto dto) {
        if (dto == null) {
            throw new BadRequestException("Schedule data is required");
        }
        return Schedule.builder()
                .schoolId(dto.getSchoolId())
                .examTerm(dto.getExamTerm())
                .className(dto.getClassName())
                .subjectName(dto.getSubjectName())
                .examDate(dto.getExamDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .roomNo(dto.getRoomNo())
                .note(dto.getNote())
                .build();
    }

    private boolean matchesSearch(ScheduleDto dto, String search) {
        String haystack = String.join(" ",
                safe(dto.getExamTerm()),
                safe(dto.getClassName()),
                safe(dto.getSubjectName()),
                safe(dto.getRoomNo()),
                safe(dto.getNote()))
                .toLowerCase();
        return haystack.contains(search.toLowerCase());
    }

    private Page<ScheduleDto> slice(List<ScheduleDto> rows, Pageable pageable) {
        int start = Math.min(pageable.getPageNumber() * pageable.getPageSize(), rows.size());
        int end = Math.min(start + pageable.getPageSize(), rows.size());
        return new PageImpl<>(rows.subList(start, end), pageable, rows.size());
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
