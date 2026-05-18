package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.NoticeDto;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.Notice;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.NoticeRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.NoticeService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.time.LocalDate;
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
public class NoticeServiceImpl implements NoticeService {

    private final NoticeRepository noticeRepository;
    private final SchoolRepository schoolRepository;

    public NoticeServiceImpl(NoticeRepository noticeRepository, SchoolRepository schoolRepository) {
        this.noticeRepository = noticeRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoticeDto.Response> list(Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        List<Notice> rows;
        if (user.isSuperAdmin() && schoolId == null) {
            rows = noticeRepository.findAllByIsDeletedFalseOrderByIdDesc();
        } else {
            Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
            rows = noticeRepository.findBySchoolIdAndIsDeletedFalseOrderByIdDesc(effectiveSchoolId);
        }
        return rows.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NoticeDto.Response> page(Long schoolId, String search, String noticeFor, Boolean isViewOnWeb, int page, int size) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        final String q = normalizeOptional(search);
        final String type = normalizeOptional(noticeFor);
        List<NoticeDto.Response> filtered = noticeRepository.findBySchoolIdAndIsDeletedFalseOrderByIdDesc(effectiveSchoolId).stream()
                .map(this::toResponse)
                .filter(dto -> matches(dto, q, type, isViewOnWeb))
                .sorted(Comparator.comparing(NoticeDto.Response::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
        int start = Math.min(pageable.getPageNumber() * pageable.getPageSize(), filtered.size());
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        return new PageImpl<>(filtered.subList(start, end), pageable, filtered.size());
    }

    @Override
    public NoticeDto.Response create(NoticeDto.Request request) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, request == null ? null : request.getSchoolId());
        Notice entity = new Notice();
        entity.setSchoolId(effectiveSchoolId);
        entity.setTitle(normalizeRequired(request == null ? null : request.getTitle(), "Title is required"));
        entity.setNoticeDate(requireDate(request == null ? null : request.getDate()));
        entity.setNoticeFor(normalizeOptional(request == null ? null : request.getNoticeFor()));
        entity.setNotice(normalizeOptional(request == null ? null : request.getNotice()));
        entity.setIsViewOnWeb(Boolean.TRUE.equals(request == null ? null : request.getIsViewOnWeb()));
        entity.setIsDeleted(false);
        return toResponse(noticeRepository.save(entity));
    }

    @Override
    public NoticeDto.Response update(Long id, NoticeDto.Request request) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Notice entity = noticeRepository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, request == null ? null : request.getSchoolId());
        if (!Objects.equals(entity.getSchoolId(), effectiveSchoolId) && !user.isSuperAdmin()) {
            throw new ForbiddenException();
        }

        entity.setSchoolId(effectiveSchoolId);
        entity.setTitle(normalizeRequired(request == null ? null : request.getTitle(), "Title is required"));
        entity.setNoticeDate(requireDate(request == null ? null : request.getDate()));
        entity.setNoticeFor(normalizeOptional(request == null ? null : request.getNoticeFor()));
        entity.setNotice(normalizeOptional(request == null ? null : request.getNotice()));
        entity.setIsViewOnWeb(Boolean.TRUE.equals(request == null ? null : request.getIsViewOnWeb()));
        return toResponse(noticeRepository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Notice entity = noticeRepository.findById(id).orElseThrow(NotFoundException::new);
        Long entitySchoolId = entity.getSchoolId();
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, entitySchoolId);
        if (!Objects.equals(entitySchoolId, effectiveSchoolId) && !user.isSuperAdmin()) {
            throw new ForbiddenException();
        }
        entity.setIsDeleted(true);
        noticeRepository.save(entity);
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

    private NoticeDto.Response toResponse(Notice entity) {
        NoticeDto.Response dto = new NoticeDto.Response();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setSchoolName(resolveSchoolName(entity.getSchoolId()));
        dto.setTitle(entity.getTitle());
        dto.setDate(entity.getNoticeDate());
        dto.setNoticeFor(entity.getNoticeFor());
        dto.setNotice(entity.getNotice());
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

    private boolean matches(NoticeDto.Response dto, String search, String noticeFor, Boolean isViewOnWeb) {
        if (noticeFor != null && !equalsIgnoreCaseSafe(dto.getNoticeFor(), noticeFor)) {
            return false;
        }
        if (isViewOnWeb != null && !Objects.equals(dto.getIsViewOnWeb(), isViewOnWeb)) {
            return false;
        }
        if (search == null) {
            return true;
        }
        String q = search.toLowerCase(Locale.ROOT);
        return containsIgnoreCase(dto.getTitle(), q)
                || containsIgnoreCase(dto.getNotice(), q)
                || containsIgnoreCase(dto.getNoticeFor(), q);
    }

    private boolean containsIgnoreCase(String value, String query) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(query);
    }

    private boolean equalsIgnoreCaseSafe(String value, String query) {
        return value != null && value.equalsIgnoreCase(query);
    }

    private LocalDate requireDate(LocalDate value) {
        if (value == null) throw new BadRequestException("Date is required");
        return value;
    }
}
