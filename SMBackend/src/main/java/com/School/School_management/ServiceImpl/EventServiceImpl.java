package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.EventDto;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.SchoolEvent;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.EventRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.EventService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final SchoolRepository schoolRepository;

    public EventServiceImpl(EventRepository eventRepository, SchoolRepository schoolRepository) {
        this.eventRepository = eventRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventDto.Response> list(Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        List<SchoolEvent> rows;
        if (user.isSuperAdmin() && schoolId == null) {
            rows = eventRepository.findAllByIsDeletedFalseOrderByIdDesc();
        } else {
            Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
            rows = eventRepository.findBySchoolIdAndIsDeletedFalseOrderByIdDesc(effectiveSchoolId);
        }
        return rows.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public EventDto.Response create(EventDto.Request request) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, request == null ? null : request.getSchoolId());
        SchoolEvent entity = new SchoolEvent();
        entity.setSchoolId(effectiveSchoolId);
        entity.setTitle(normalizeRequired(request == null ? null : request.getTitle(), "Title is required"));
        entity.setEventFor(normalizeRequired(request == null ? null : request.getEventFor(), "Event for is required"));
        entity.setEventPlace(normalizeRequired(request == null ? null : request.getEventPlace(), "Event place is required"));
        entity.setFromDate(requireDate(request == null ? null : request.getFromDate(), "From date is required"));
        entity.setToDate(requireDate(request == null ? null : request.getToDate(), "To date is required"));
        entity.setImage(normalizeOptional(request == null ? null : request.getImage()));
        entity.setNote(normalizeOptional(request == null ? null : request.getNote()));
        entity.setIsViewOnWeb(Boolean.TRUE.equals(request == null ? null : request.getIsViewOnWeb()));
        entity.setIsDeleted(false);
        return toResponse(eventRepository.save(entity));
    }

    @Override
    public EventDto.Response update(Long id, EventDto.Request request) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        SchoolEvent entity = eventRepository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, request == null ? null : request.getSchoolId());
        if (!Objects.equals(entity.getSchoolId(), effectiveSchoolId) && !user.isSuperAdmin()) {
            throw new ForbiddenException();
        }

        entity.setSchoolId(effectiveSchoolId);
        entity.setTitle(normalizeRequired(request == null ? null : request.getTitle(), "Title is required"));
        entity.setEventFor(normalizeRequired(request == null ? null : request.getEventFor(), "Event for is required"));
        entity.setEventPlace(normalizeRequired(request == null ? null : request.getEventPlace(), "Event place is required"));
        entity.setFromDate(requireDate(request == null ? null : request.getFromDate(), "From date is required"));
        entity.setToDate(requireDate(request == null ? null : request.getToDate(), "To date is required"));
        entity.setImage(normalizeOptional(request == null ? null : request.getImage()));
        entity.setNote(normalizeOptional(request == null ? null : request.getNote()));
        entity.setIsViewOnWeb(Boolean.TRUE.equals(request == null ? null : request.getIsViewOnWeb()));
        return toResponse(eventRepository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        SchoolEvent entity = eventRepository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, entity.getSchoolId());
        if (!Objects.equals(entity.getSchoolId(), effectiveSchoolId) && !user.isSuperAdmin()) {
            throw new ForbiddenException();
        }
        entity.setIsDeleted(true);
        eventRepository.save(entity);
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
        boolean ok = schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isPresent();
        if (!ok) throw new NotFoundException();
    }

    private EventDto.Response toResponse(SchoolEvent entity) {
        EventDto.Response dto = new EventDto.Response();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setSchoolName(resolveSchoolName(entity.getSchoolId()));
        dto.setTitle(entity.getTitle());
        dto.setEventFor(entity.getEventFor());
        dto.setEventPlace(entity.getEventPlace());
        dto.setFromDate(entity.getFromDate());
        dto.setToDate(entity.getToDate());
        dto.setImage(entity.getImage());
        dto.setNote(entity.getNote());
        dto.setIsViewOnWeb(entity.getIsViewOnWeb());
        return dto;
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

    private java.time.LocalDate requireDate(java.time.LocalDate value, String message) {
        if (value == null) throw new BadRequestException(message);
        return value;
    }
}
