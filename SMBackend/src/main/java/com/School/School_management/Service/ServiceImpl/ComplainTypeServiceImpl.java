package com.School.School_management.Service.ServiceImpl;

import com.School.School_management.Dto.ComplainTypeDto;
import com.School.School_management.Entity.ComplainType;
import com.School.School_management.Repository.ComplainTypeRepository;
import com.School.School_management.Service.ComplainTypeService;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class ComplainTypeServiceImpl implements ComplainTypeService {

    private final ComplainTypeRepository repository;

    public ComplainTypeServiceImpl(ComplainTypeRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<ComplainTypeDto> getAllBySchool(Long schoolId) {
        return repository.findBySchoolIdAndIsDeletedFalse(schoolId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public ComplainTypeDto save(ComplainTypeDto dto) {
        ComplainType entity = new ComplainType();
        mapDtoToEntity(dto, entity);
        return toDto(repository.save(entity));
    }

    @Override
    public ComplainTypeDto update(Long id, ComplainTypeDto dto) {
        ComplainType entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complain Type not found"));
        mapDtoToEntity(dto, entity);
        return toDto(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        ComplainType entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complain Type not found"));
        entity.setIsDeleted(true);
        repository.save(entity);
    }

    private void mapDtoToEntity(ComplainTypeDto dto, ComplainType entity) {
        entity.setSchoolId(dto.getSchoolId());
        entity.setComplainType(dto.getComplainType());
    }

    private ComplainTypeDto toDto(ComplainType entity) {
        return new ComplainTypeDto(entity.getId(), entity.getSchoolId(), entity.getComplainType());
    }
}
