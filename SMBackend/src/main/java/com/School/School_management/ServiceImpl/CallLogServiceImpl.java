package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.CallLogDto;
import com.School.School_management.Entity.CallLog;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Repository.CallLogRepository;
import com.School.School_management.Service.CallLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class CallLogServiceImpl implements CallLogService {

    @Autowired
    private CallLogRepository repository;

    @Override
    public List<CallLogDto> getAllBySchool(Long schoolId) {
        return repository.findBySchoolIdAndIsDeletedFalse(schoolId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<CallLogDto> pageBySchool(Long schoolId, String search, String callType, int page, int size) {
        if (schoolId == null) {
            throw new BadRequestException("schoolId is required");
        }
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by("id").descending());
        final String q = normalize(search);
        final String type = normalize(callType);
        List<CallLogDto> filtered = repository.findBySchoolIdAndIsDeletedFalse(schoolId).stream()
                .map(this::toDto)
                .filter(dto -> matches(dto, q, type))
                .sorted((a, b) -> Long.compare(
                        b.getId() == null ? Long.MIN_VALUE : b.getId(),
                        a.getId() == null ? Long.MIN_VALUE : a.getId()))
                .collect(Collectors.toList());
        int start = Math.min(pageable.getPageNumber() * pageable.getPageSize(), filtered.size());
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        return new PageImpl<>(filtered.subList(start, end), pageable, filtered.size());
    }

    @Override
    public CallLogDto save(CallLogDto dto) {
        CallLog entity = new CallLog();
        mapDtoToEntity(dto, entity);
        return toDto(repository.save(entity));
    }

    @Override
    public CallLogDto update(Long id, CallLogDto dto) {
        CallLog entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Call Log not found"));
        mapDtoToEntity(dto, entity);
        return toDto(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CallLog entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Call Log not found"));
        entity.setIsDeleted(true);
        repository.save(entity);
    }

    private void mapDtoToEntity(CallLogDto dto, CallLog entity) {
        entity.setSchoolId(dto.getSchoolId());
        entity.setName(dto.getName());
        entity.setPhone(dto.getPhone());
        entity.setDate(dto.getDate());
        entity.setFollowUpDate(dto.getFollowUpDate());
        entity.setCallDuration(dto.getCallDuration());
        entity.setCallType(dto.getCallType());
        entity.setNote(dto.getNote());
    }

    private CallLogDto toDto(CallLog entity) {
        CallLogDto dto = new CallLogDto();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setName(entity.getName());
        dto.setPhone(entity.getPhone());
        dto.setDate(entity.getDate());
        dto.setFollowUpDate(entity.getFollowUpDate());
        dto.setCallDuration(entity.getCallDuration());
        dto.setCallType(entity.getCallType());
        dto.setNote(entity.getNote());
        return dto;
    }

    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean matches(CallLogDto dto, String search, String callType) {
        if (callType != null && !equalsIgnoreCaseSafe(dto.getCallType(), callType)) {
            return false;
        }
        if (search == null) {
            return true;
        }
        String q = search.toLowerCase(Locale.ROOT);
        return containsIgnoreCase(dto.getName(), q)
                || containsIgnoreCase(dto.getPhone(), q)
                || containsIgnoreCase(dto.getCallDuration(), q)
                || containsIgnoreCase(dto.getCallType(), q)
                || containsIgnoreCase(dto.getNote(), q);
    }

    private boolean containsIgnoreCase(String value, String query) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(query);
    }

    private boolean equalsIgnoreCaseSafe(String value, String query) {
        return value != null && value.equalsIgnoreCase(query);
    }
}
