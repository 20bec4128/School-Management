package com.School.School_management.Service.ServiceImpl;

import com.School.School_management.Dto.PostalDispatchDto;
import com.School.School_management.Entity.PostalDispatch;
import com.School.School_management.Repository.PostalDispatchRepository;
import com.School.School_management.Service.PostalDispatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
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
}
