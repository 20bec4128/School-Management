package com.School.School_management.Service.ServiceImpl;

import com.School.School_management.Dto.PostalReceiveDto;
import com.School.School_management.Entity.PostalReceive;
import com.School.School_management.Repository.PostalReceiveRepository;
import com.School.School_management.Service.PostalReceiveService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PostalReceiveServiceImpl implements PostalReceiveService {

    @Autowired
    private PostalReceiveRepository repository;

    @Override
    public List<PostalReceiveDto> getAllBySchool(Long schoolId) {
        return repository.findBySchoolIdAndIsDeletedFalse(schoolId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public PostalReceiveDto save(PostalReceiveDto dto) {
        PostalReceive entity = new PostalReceive();
        mapDtoToEntity(dto, entity);
        return toDto(repository.save(entity));
    }

    @Override
    public PostalReceiveDto update(Long id, PostalReceiveDto dto) {
        PostalReceive entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Postal Receive not found"));
        mapDtoToEntity(dto, entity);
        return toDto(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        PostalReceive entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Postal Receive not found"));
        entity.setIsDeleted(true);
        repository.save(entity);
    }

    private void mapDtoToEntity(PostalReceiveDto dto, PostalReceive entity) {
        entity.setSchoolId(dto.getSchoolId());
        entity.setFromTitle(dto.getFromTitle());
        entity.setReferenceNo(dto.getReferenceNo());
        entity.setAddress(dto.getAddress());
        entity.setToTitle(dto.getToTitle());
        entity.setDate(dto.getDate());
        entity.setNote(dto.getNote());
        entity.setFilePath(dto.getFilePath());
    }

    private PostalReceiveDto toDto(PostalReceive entity) {
        PostalReceiveDto dto = new PostalReceiveDto();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setFromTitle(entity.getFromTitle());
        dto.setReferenceNo(entity.getReferenceNo());
        dto.setAddress(entity.getAddress());
        dto.setToTitle(entity.getToTitle());
        dto.setDate(entity.getDate());
        dto.setNote(entity.getNote());
        dto.setFilePath(entity.getFilePath());
        return dto;
    }
}
