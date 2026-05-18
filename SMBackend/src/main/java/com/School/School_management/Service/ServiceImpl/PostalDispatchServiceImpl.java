package com.School.School_management.Service.ServiceImpl;

import com.School.School_management.Dto.PostalDispatchDto;
import com.School.School_management.Entity.PostalDispatch;
import com.School.School_management.Repository.PostalDispatchRepository;
import com.School.School_management.Service.PostalDispatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class PostalDispatchServiceImpl implements PostalDispatchService {

    @Autowired
    private PostalDispatchRepository repository;

    @Override
    public List<PostalDispatchDto> getAllBySchool(Long schoolId) {
        return repository.findBySchoolIdAndIsDeletedFalse(schoolId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<PostalDispatchDto> pageBySchool(Long schoolId, String search, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        final String q = normalize(search);
        List<PostalDispatchDto> filtered = repository.findBySchoolIdAndIsDeletedFalse(schoolId).stream()
                .map(this::toDto)
                .filter(dto -> matches(dto, q))
                .sorted(Comparator.comparing(PostalDispatchDto::getDate, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(PostalDispatchDto::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
        int start = Math.min(pageable.getPageNumber() * pageable.getPageSize(), filtered.size());
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        return new PageImpl<>(filtered.subList(start, end), pageable, filtered.size());
    }

    @Override
    public PostalDispatchDto save(PostalDispatchDto dto) {
        PostalDispatch entity = new PostalDispatch();
        mapDtoToEntity(dto, entity);
        return toDto(repository.save(entity));
    }

    @Override
    public PostalDispatchDto update(Long id, PostalDispatchDto dto) {
        PostalDispatch entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Postal Dispatch not found"));
        mapDtoToEntity(dto, entity);
        return toDto(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        PostalDispatch entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Postal Dispatch not found"));
        entity.setIsDeleted(true);
        repository.save(entity);
    }

    private void mapDtoToEntity(PostalDispatchDto dto, PostalDispatch entity) {
        entity.setSchoolId(dto.getSchoolId());
        entity.setToTitle(dto.getToTitle());
        entity.setReferenceNo(dto.getReferenceNo());
        entity.setAddress(dto.getAddress());
        entity.setFromTitle(dto.getFromTitle());
        entity.setDate(dto.getDate());
        entity.setNote(dto.getNote());
        entity.setFilePath(dto.getFilePath());
    }

    private PostalDispatchDto toDto(PostalDispatch entity) {
        PostalDispatchDto dto = new PostalDispatchDto();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setToTitle(entity.getToTitle());
        dto.setReferenceNo(entity.getReferenceNo());
        dto.setAddress(entity.getAddress());
        dto.setFromTitle(entity.getFromTitle());
        dto.setDate(entity.getDate());
        dto.setNote(entity.getNote());
        dto.setFilePath(entity.getFilePath());
        return dto;
    }

    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean matches(PostalDispatchDto dto, String search) {
        if (search == null) {
            return true;
        }
        String q = search.toLowerCase(Locale.ROOT);
        return containsIgnoreCase(dto.getToTitle(), q)
                || containsIgnoreCase(dto.getFromTitle(), q)
                || containsIgnoreCase(dto.getReferenceNo(), q)
                || containsIgnoreCase(dto.getAddress(), q)
                || containsIgnoreCase(dto.getNote(), q);
    }

    private boolean containsIgnoreCase(String value, String query) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(query);
    }
}
