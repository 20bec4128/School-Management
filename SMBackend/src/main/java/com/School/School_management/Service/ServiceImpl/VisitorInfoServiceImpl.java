package com.School.School_management.Service.ServiceImpl;

import com.School.School_management.Dto.VisitorInfoDto;
import com.School.School_management.Entity.VisitorInfo;
import com.School.School_management.Entity.VisitorPurpose;
import com.School.School_management.Repository.VisitorInfoRepository;
import com.School.School_management.Repository.VisitorPurposeRepository;
import com.School.School_management.Service.VisitorInfoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class VisitorInfoServiceImpl implements VisitorInfoService {

    @Autowired
    private VisitorInfoRepository repository;

    @Autowired
    private VisitorPurposeRepository purposeRepository;

    @Override
    public List<VisitorInfoDto> getAllBySchool(Long schoolId) {
        return repository.findBySchoolIdAndIsDeletedFalse(schoolId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public VisitorInfoDto save(VisitorInfoDto dto) {
        VisitorInfo entity = new VisitorInfo();
        mapDtoToEntity(dto, entity);
        return toDto(repository.save(entity));
    }

    @Override
    public VisitorInfoDto update(Long id, VisitorInfoDto dto) {
        VisitorInfo entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visitor Info not found"));
        mapDtoToEntity(dto, entity);
        return toDto(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        VisitorInfo entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visitor Info not found"));
        entity.setIsDeleted(true);
        repository.save(entity);
    }

    private void mapDtoToEntity(VisitorInfoDto dto, VisitorInfo entity) {
        entity.setSchoolId(dto.getSchoolId());
        entity.setName(dto.getName());
        entity.setPhone(dto.getPhone());
        entity.setComingFrom(dto.getComingFrom());
        entity.setIdCard(dto.getIdCard());
        entity.setNumOfPerson(dto.getNumOfPerson());
        entity.setDate(dto.getDate());
        entity.setInTime(dto.getInTime());
        entity.setOutTime(dto.getOutTime());
        entity.setNote(dto.getNote());
        entity.setFilePath(dto.getFilePath());

        if (dto.getPurposeId() != null) {
            VisitorPurpose purpose = purposeRepository.findById(dto.getPurposeId())
                    .orElseThrow(() -> new RuntimeException("Purpose not found"));
            entity.setPurpose(purpose);
        } else {
            entity.setPurpose(null);
        }
    }

    private VisitorInfoDto toDto(VisitorInfo entity) {
        VisitorInfoDto dto = new VisitorInfoDto();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setName(entity.getName());
        dto.setPhone(entity.getPhone());
        dto.setComingFrom(entity.getComingFrom());
        dto.setIdCard(entity.getIdCard());
        dto.setNumOfPerson(entity.getNumOfPerson());
        dto.setDate(entity.getDate());
        dto.setInTime(entity.getInTime());
        dto.setOutTime(entity.getOutTime());
        dto.setNote(entity.getNote());
        dto.setFilePath(entity.getFilePath());

        if (entity.getPurpose() != null) {
            dto.setPurposeId(entity.getPurpose().getId());
            dto.setPurposeName(entity.getPurpose().getPurpose());
        }
        return dto;
    }
}
