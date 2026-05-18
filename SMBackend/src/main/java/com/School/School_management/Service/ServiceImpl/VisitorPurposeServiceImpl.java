package com.School.School_management.Service.ServiceImpl;

import com.School.School_management.Dto.VisitorPurposeDto;
import com.School.School_management.Entity.VisitorPurpose;
import com.School.School_management.Repository.VisitorPurposeRepository;
import com.School.School_management.Service.VisitorPurposeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VisitorPurposeServiceImpl implements VisitorPurposeService {

    @Autowired
    private VisitorPurposeRepository repository;

    @Override
    public List<VisitorPurposeDto> getAllBySchool(Long schoolId) {
        return repository.findBySchoolIdAndIsDeletedFalse(schoolId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<VisitorPurposeDto> pageBySchool(Long schoolId, String search, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        final String searchTerm = (search == null ? null : search.trim());
        List<VisitorPurposeDto> rows = repository.findBySchoolIdAndIsDeletedFalse(schoolId).stream()
                .map(this::toDto)
                .filter((row) -> {
                    if (searchTerm == null || searchTerm.isEmpty()) return true;
                    return String.valueOf(row.getPurpose() == null ? "" : row.getPurpose())
                            .toLowerCase()
                            .contains(searchTerm.toLowerCase());
                })
                .sorted(Comparator.comparing(VisitorPurposeDto::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        int start = Math.min(pageable.getPageNumber() * pageable.getPageSize(), rows.size());
        int end = Math.min(start + pageable.getPageSize(), rows.size());
        return new PageImpl<>(rows.subList(start, end), pageable, rows.size());
    }

    @Override
    public VisitorPurposeDto save(VisitorPurposeDto dto) {
        VisitorPurpose entity = new VisitorPurpose();
        entity.setSchoolId(dto.getSchoolId());
        entity.setPurpose(dto.getPurpose());
        return toDto(repository.save(entity));
    }

    @Override
    public VisitorPurposeDto update(Long id, VisitorPurposeDto dto) {
        VisitorPurpose entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visitor Purpose not found"));
        entity.setPurpose(dto.getPurpose());
        return toDto(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        VisitorPurpose entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visitor Purpose not found"));
        entity.setIsDeleted(true);
        repository.save(entity);
    }

    private VisitorPurposeDto toDto(VisitorPurpose entity) {
        return new VisitorPurposeDto(entity.getId(), entity.getSchoolId(), entity.getPurpose());
    }
}
