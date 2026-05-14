package com.School.School_management.Service.ServiceImpl;

import com.School.School_management.Dto.CallLogDto;
import com.School.School_management.Entity.CallLog;
import com.School.School_management.Repository.CallLogRepository;
import com.School.School_management.Service.CallLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
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
}
