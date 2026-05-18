package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.MarkSendSmsDto;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.MarkSendSms;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.MarkSendSmsRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.MarkSendSmsService;
import com.School.School_management.auth.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@Transactional
public class MarkSendSmsServiceImpl implements MarkSendSmsService {

    private final MarkSendSmsRepository repository;
    private final SchoolRepository schoolRepository;

    public MarkSendSmsServiceImpl(MarkSendSmsRepository repository, SchoolRepository schoolRepository) {
        this.repository = repository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MarkSendSmsDto> list(Long headOfficeId, Long schoolId, String examTerm, String receiverType, String receiver, String template, String gateway, String search, CurrentUser user) {
        Scope scope = resolveScopeForRead(user, headOfficeId, schoolId);
        return repository.findAll(Sort.by(Sort.Order.desc("sendDate"), Sort.Order.desc("id"))).stream()
                .filter(row -> scope.headOfficeId == null || Objects.equals(scope.headOfficeId, row.getHeadOfficeId()))
                .filter(row -> scope.schoolId == null || Objects.equals(scope.schoolId, row.getSchoolId()))
                .filter(row -> examTerm == null || equalsIgnoreCase(row.getExamTerm(), examTerm))
                .filter(row -> receiverType == null || equalsIgnoreCase(row.getReceiverType(), receiverType))
                .filter(row -> receiver == null || equalsIgnoreCase(row.getReceiver(), receiver))
                .filter(row -> template == null || equalsIgnoreCase(row.getTemplate(), template))
                .filter(row -> gateway == null || equalsIgnoreCase(row.getGateway(), gateway))
                .filter(row -> search == null || containsSearch(row, search))
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MarkSendSmsDto> listPaginated(Long headOfficeId, Long schoolId, String examTerm, String receiverType, String receiver, String template, String gateway, String search, int page, int size, CurrentUser user) {
        List<MarkSendSmsDto> filtered = list(headOfficeId, schoolId, examTerm, receiverType, receiver, template, gateway, search, user);
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        int fromIndex = Math.min(safePage * safeSize, filtered.size());
        int toIndex = Math.min(fromIndex + safeSize, filtered.size());
        List<MarkSendSmsDto> content = filtered.subList(fromIndex, toIndex);
        return new PageImpl<>(content, PageRequest.of(safePage, safeSize, Sort.by(Sort.Order.desc("sendDate"), Sort.Order.desc("id"))), filtered.size());
    }

    @Override
    @Transactional(readOnly = true)
    public MarkSendSmsDto findById(Long id, CurrentUser user) {
        MarkSendSms entity = repository.findById(id).orElseThrow(NotFoundException::new);
        if (!canAccess(user, entity)) throw new ForbiddenException();
        return toDto(entity);
    }

    @Override
    public MarkSendSmsDto create(MarkSendSmsDto dto, CurrentUser user) {
        MarkSendSms entity = new MarkSendSms();
        applyDto(entity, dto, user, true);
        return toDto(repository.save(entity));
    }

    @Override
    public MarkSendSmsDto update(Long id, MarkSendSmsDto dto, CurrentUser user) {
        MarkSendSms entity = repository.findById(id).orElseThrow(NotFoundException::new);
        if (!canAccess(user, entity)) throw new ForbiddenException();
        applyDto(entity, dto, user, false);
        return toDto(repository.save(entity));
    }

    @Override
    public void delete(Long id, CurrentUser user) {
        MarkSendSms entity = repository.findById(id).orElseThrow(NotFoundException::new);
        if (!canAccess(user, entity)) throw new ForbiddenException();
        repository.delete(entity);
    }

    private void applyDto(MarkSendSms entity, MarkSendSmsDto dto, CurrentUser user, boolean creating) {
        if (dto == null) throw new BadRequestException("SMS dispatch data is required");

        Scope scope = resolveScopeForWrite(user, dto.getHeadOfficeId(), dto.getSchoolId());
        ManageSchool school = resolveSchool(scope.schoolId);
        Long effectiveHeadOfficeId = resolveHeadOfficeId(school, scope.headOfficeId);

        entity.setHeadOfficeId(effectiveHeadOfficeId);
        entity.setSchoolId(school.getId());
        entity.setSchoolName(normalizeOptional(dto.getSchoolName()) != null ? dto.getSchoolName().trim() : school.getSchoolName());
        entity.setExamTerm(required(dto.getExamTerm(), "Exam term is required"));
        entity.setReceiverType(required(dto.getReceiverType(), "Receiver type is required"));
        entity.setReceiver(required(dto.getReceiver(), "Receiver is required"));
        entity.setTemplate(normalizeOptional(dto.getTemplate()));
        entity.setSms(required(dto.getSms(), "SMS is required"));
        entity.setGateway(required(dto.getGateway(), "Gateway is required"));
        if (creating) {
            entity.setSendDate(dto.getSendDate());
        } else if (dto.getSendDate() != null) {
            entity.setSendDate(dto.getSendDate());
        }
    }

    private boolean containsSearch(MarkSendSms row, String search) {
        String content = String.join(" ",
                safe(row.getSchoolName()),
                safe(row.getExamTerm()),
                safe(row.getReceiverType()),
                safe(row.getReceiver()),
                safe(row.getTemplate()),
                safe(row.getSms()),
                safe(row.getGateway())
        ).toLowerCase();
        return content.contains(search.toLowerCase());
    }

    private MarkSendSmsDto toDto(MarkSendSms entity) {
        MarkSendSmsDto dto = new MarkSendSmsDto();
        dto.setId(entity.getId());
        dto.setHeadOfficeId(entity.getHeadOfficeId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setSchoolName(entity.getSchoolName());
        dto.setExamTerm(entity.getExamTerm());
        dto.setReceiverType(entity.getReceiverType());
        dto.setReceiver(entity.getReceiver());
        dto.setTemplate(entity.getTemplate());
        dto.setSms(entity.getSms());
        dto.setGateway(entity.getGateway());
        dto.setSendDate(entity.getSendDate());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    private boolean canAccess(CurrentUser user, MarkSendSms entity) {
        if (user == null || entity == null) return false;
        if (user.isSuperAdmin() || user.adminId() != null) return true;
        if (user.isSchoolScoped()) {
            return user.schoolId() != null && Objects.equals(user.schoolId(), entity.getSchoolId());
        }
        if (user.isHeadOfficeScopedAdmin()) {
            return user.headOfficeId() != null && Objects.equals(user.headOfficeId(), entity.getHeadOfficeId());
        }
        return false;
    }

    private Scope resolveScopeForRead(CurrentUser user, Long requestedHeadOfficeId, Long requestedSchoolId) {
        if (user == null) throw new ForbiddenException();
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
        if (user == null) throw new ForbiddenException();
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
        if (headOfficeId == null) throw new BadRequestException("headOfficeId is required");
        if (!schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isPresent()) {
            throw new NotFoundException();
        }
    }

    private ManageSchool resolveSchool(Long schoolId) {
        if (schoolId == null) throw new BadRequestException("schoolId is required");
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId).orElseThrow(NotFoundException::new);
    }

    private Long resolveHeadOfficeId(ManageSchool school, Long requestedHeadOfficeId) {
        Long schoolHeadOfficeId = school.getHeadOfficeId();
        if (schoolHeadOfficeId != null && requestedHeadOfficeId != null && !Objects.equals(schoolHeadOfficeId, requestedHeadOfficeId)) {
            throw new BadRequestException("Selected school does not belong to the requested head office");
        }
        if (schoolHeadOfficeId != null) return schoolHeadOfficeId;
        if (requestedHeadOfficeId != null) return requestedHeadOfficeId;
        throw new BadRequestException("headOfficeId is required");
    }

    private String required(String value, String message) {
        String normalized = normalizeOptional(value);
        if (normalized == null) throw new BadRequestException(message);
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String safe(String value) {
        String normalized = normalizeOptional(value);
        return normalized == null ? "" : normalized;
    }

    private boolean equalsIgnoreCase(String left, String right) {
        if (left == null || right == null) return false;
        return left.trim().equalsIgnoreCase(right.trim());
    }

    private record Scope(Long headOfficeId, Long schoolId) {}
}
