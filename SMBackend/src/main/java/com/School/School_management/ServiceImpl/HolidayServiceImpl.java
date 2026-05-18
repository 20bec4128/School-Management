package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.HolidayDto;
import com.School.School_management.Entity.Holiday;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.HolidayRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.HolidayService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class HolidayServiceImpl implements HolidayService {

    private final HolidayRepository holidayRepository;
    private final SchoolRepository schoolRepository;

    public HolidayServiceImpl(HolidayRepository holidayRepository, SchoolRepository schoolRepository) {
        this.holidayRepository = holidayRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<HolidayDto.Response> list(Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        List<Holiday> rows;
        if (user.isSuperAdmin() && schoolId == null) {
            rows = holidayRepository.findAllByIsDeletedFalseOrderByIdDesc();
        } else {
            Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
            rows = holidayRepository.findBySchoolIdAndIsDeletedFalseOrderByIdDesc(effectiveSchoolId);
        }
        return rows.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<HolidayDto.Response> page(Long schoolId, String search, Boolean isViewOnWeb, int page, int size) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        final String q = normalizeOptional(search);
        List<HolidayDto.Response> filtered = holidayRepository.findBySchoolIdAndIsDeletedFalseOrderByIdDesc(effectiveSchoolId).stream()
                .map(this::toResponse)
                .filter(dto -> matches(dto, q, isViewOnWeb))
                .sorted(Comparator.comparing(HolidayDto.Response::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
        int start = Math.min(pageable.getPageNumber() * pageable.getPageSize(), filtered.size());
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        return new PageImpl<>(filtered.subList(start, end), pageable, filtered.size());
    }

    @Override
    public HolidayDto.Response create(HolidayDto.Request request) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, request == null ? null : request.getSchoolId());
        Holiday entity = new Holiday();
        entity.setSchoolId(effectiveSchoolId);
        entity.setTitle(normalizeRequired(request == null ? null : request.getTitle(), "Title is required"));
        entity.setFromDate(requireDate(request == null ? null : request.getFromDate(), "From date is required"));
        entity.setToDate(requireDate(request == null ? null : request.getToDate(), "To date is required"));
        entity.setNote(normalizeOptional(request == null ? null : request.getNote()));
        entity.setIsViewOnWeb(Boolean.TRUE.equals(request == null ? null : request.getIsViewOnWeb()));
        entity.setIsDeleted(false);
        return toResponse(holidayRepository.save(entity));
    }

    @Override
    public HolidayDto.Response update(Long id, HolidayDto.Request request) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Holiday entity = holidayRepository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, request == null ? null : request.getSchoolId());
        if (!Objects.equals(entity.getSchoolId(), effectiveSchoolId) && !user.isSuperAdmin()) {
            throw new ForbiddenException();
        }

        entity.setSchoolId(effectiveSchoolId);
        entity.setTitle(normalizeRequired(request == null ? null : request.getTitle(), "Title is required"));
        entity.setFromDate(requireDate(request == null ? null : request.getFromDate(), "From date is required"));
        entity.setToDate(requireDate(request == null ? null : request.getToDate(), "To date is required"));
        entity.setNote(normalizeOptional(request == null ? null : request.getNote()));
        entity.setIsViewOnWeb(Boolean.TRUE.equals(request == null ? null : request.getIsViewOnWeb()));
        return toResponse(holidayRepository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Holiday entity = holidayRepository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, entity.getSchoolId());
        if (!Objects.equals(entity.getSchoolId(), effectiveSchoolId) && !user.isSuperAdmin()) {
            throw new ForbiddenException();
        }
        entity.setIsDeleted(true);
        holidayRepository.save(entity);
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

    private HolidayDto.Response toResponse(Holiday entity) {
        HolidayDto.Response dto = new HolidayDto.Response();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setSchoolName(resolveSchoolName(entity.getSchoolId()));
        dto.setTitle(entity.getTitle());
        dto.setFromDate(entity.getFromDate());
        dto.setToDate(entity.getToDate());
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

    private boolean matches(HolidayDto.Response dto, String search, Boolean isViewOnWeb) {
        if (isViewOnWeb != null && !Objects.equals(dto.getIsViewOnWeb(), isViewOnWeb)) {
            return false;
        }
        if (search == null) {
            return true;
        }
        String q = search.toLowerCase(Locale.ROOT);
        return containsIgnoreCase(dto.getTitle(), q)
                || containsIgnoreCase(dto.getNote(), q);
    }

    private boolean containsIgnoreCase(String value, String query) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(query);
    }

    private java.time.LocalDate requireDate(java.time.LocalDate value, String message) {
        if (value == null) throw new BadRequestException(message);
        return value;
    }
}
