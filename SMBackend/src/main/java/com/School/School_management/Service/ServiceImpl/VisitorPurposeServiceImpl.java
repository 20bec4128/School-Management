package com.School.School_management.Service.ServiceImpl;

import com.School.School_management.Dto.VisitorPurposeDto;
import com.School.School_management.Entity.VisitorPurpose;
import com.School.School_management.Repository.VisitorPurposeRepository;
import com.School.School_management.Service.VisitorPurposeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
