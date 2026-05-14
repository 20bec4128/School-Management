package com.School.School_management.Service.ServiceImpl;

import com.School.School_management.Dto.ComplainDto;
import com.School.School_management.Entity.Complain;
import com.School.School_management.Entity.ComplainType;
import com.School.School_management.Repository.ComplainRepository;
import com.School.School_management.Repository.ComplainTypeRepository;
import com.School.School_management.Service.ComplainService;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ComplainServiceImpl implements ComplainService {

    private final ComplainRepository repository;
    private final ComplainTypeRepository complainTypeRepository;

    public ComplainServiceImpl(ComplainRepository repository, ComplainTypeRepository complainTypeRepository) {
        this.repository = repository;
        this.complainTypeRepository = complainTypeRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ComplainDto> getAllBySchool(Long schoolId) {
        return repository.findBySchoolIdAndIsDeletedFalse(schoolId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public ComplainDto save(ComplainDto dto) {
        Complain entity = new Complain();
        mapDtoToEntity(dto, entity);
        return toDto(repository.save(entity));
    }

    @Override
    public ComplainDto update(Long id, ComplainDto dto) {
        Complain entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complain not found"));
        mapDtoToEntity(dto, entity);
        return toDto(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        Complain entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complain not found"));
        entity.setIsDeleted(true);
        repository.save(entity);
    }

    private void mapDtoToEntity(ComplainDto dto, Complain entity) {
        entity.setSchoolId(dto.getSchoolId());
        entity.setAcademicYear(dto.getAcademicYear());
        entity.setUserType(dto.getUserType());
        entity.setComplainBy(dto.getComplainBy());
        entity.setComplainDate(dto.getComplainDate());
        entity.setActionDate(dto.getActionDate());
        entity.setComplain(dto.getComplain());

        if (dto.getComplainTypeId() != null) {
            ComplainType complainType = complainTypeRepository.findById(dto.getComplainTypeId())
                    .orElseThrow(() -> new RuntimeException("Complain Type not found"));
            entity.setComplainType(complainType);
        } else {
            entity.setComplainType(null);
        }
    }

    private ComplainDto toDto(Complain entity) {
        ComplainDto dto = new ComplainDto();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setAcademicYear(entity.getAcademicYear());
        dto.setUserType(entity.getUserType());
        dto.setComplainBy(entity.getComplainBy());
        dto.setComplainDate(entity.getComplainDate());
        dto.setActionDate(entity.getActionDate());
        dto.setComplain(entity.getComplain());
        if (entity.getComplainType() != null) {
            dto.setComplainTypeId(entity.getComplainType().getId());
            dto.setComplainTypeName(entity.getComplainType().getComplainType());
        }
        return dto;
    }
}
