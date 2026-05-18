package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.ResultSmsDto;
import com.School.School_management.Entity.ResultSms;
import com.School.School_management.Repository.ResultSmsRepository;
import com.School.School_management.Service.ResultSmsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ResultSmsServiceImpl implements ResultSmsService {

    @Autowired
    private ResultSmsRepository repository;

    @Override
    public List<ResultSmsDto> list(Long headOfficeId, Long schoolId) {
        return repository.findByScope(headOfficeId, schoolId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<ResultSmsDto> listPaginated(Long headOfficeId, Long schoolId, int page, int size, String search) {
        String cleanSearch = (search != null) ? search.trim() : "";
        Pageable pageable = PageRequest.of(page, size, Sort.by("sendDate").descending().and(Sort.by("id").descending()));
        return repository.findByScopeWithSearch(headOfficeId, schoolId, cleanSearch, pageable)
                .map(this::convertToDto);
    }

    @Override
    public ResultSmsDto findById(Long id) {
        ResultSms entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Result SMS history entry not found for id: " + id));
        return convertToDto(entity);
    }

    @Override
    @Transactional
    public ResultSmsDto create(ResultSmsDto dto) {
        if (dto.getSchoolId() == null) {
            throw new IllegalArgumentException("School context scope is required.");
        }
        if (dto.getExamTerm() == null || dto.getExamTerm().trim().isEmpty()) {
            throw new IllegalArgumentException("Exam term is required.");
        }
        if (dto.getReceiverType() == null || dto.getReceiverType().trim().isEmpty()) {
            throw new IllegalArgumentException("Receiver type is required.");
        }
        if (dto.getReceiver() == null || dto.getReceiver().trim().isEmpty()) {
            throw new IllegalArgumentException("Receiver is required.");
        }
        if (dto.getSubject() == null || dto.getSubject().trim().isEmpty()) {
            throw new IllegalArgumentException("Subject is required.");
        }
        if (dto.getSmsBody() == null || dto.getSmsBody().trim().isEmpty()) {
            throw new IllegalArgumentException("SMS body is required.");
        }

        ResultSms entity = convertToEntity(dto);
        ResultSms saved = repository.save(entity);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public ResultSmsDto update(Long id, ResultSmsDto dto) {
        ResultSms existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Result SMS history entry not found for id: " + id));

        if (dto.getSchoolId() == null) {
            throw new IllegalArgumentException("School context scope is required.");
        }
        if (dto.getExamTerm() == null || dto.getExamTerm().trim().isEmpty()) {
            throw new IllegalArgumentException("Exam term is required.");
        }
        if (dto.getReceiverType() == null || dto.getReceiverType().trim().isEmpty()) {
            throw new IllegalArgumentException("Receiver type is required.");
        }
        if (dto.getReceiver() == null || dto.getReceiver().trim().isEmpty()) {
            throw new IllegalArgumentException("Receiver is required.");
        }
        if (dto.getSubject() == null || dto.getSubject().trim().isEmpty()) {
            throw new IllegalArgumentException("Subject is required.");
        }
        if (dto.getSmsBody() == null || dto.getSmsBody().trim().isEmpty()) {
            throw new IllegalArgumentException("SMS body is required.");
        }

        existing.setHeadOfficeId(dto.getHeadOfficeId());
        existing.setSchoolId(dto.getSchoolId());
        existing.setSchoolName(dto.getSchoolName());
        existing.setExamTerm(dto.getExamTerm());
        existing.setReceiverType(dto.getReceiverType());
        existing.setReceiver(dto.getReceiver());
        existing.setTemplate(dto.getTemplate());
        existing.setSubject(dto.getSubject());
        existing.setSmsBody(dto.getSmsBody());
        
        if (dto.getSendDate() != null) {
            existing.setSendDate(dto.getSendDate());
        }

        ResultSms updated = repository.save(existing);
        return convertToDto(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Result SMS history entry not found for id: " + id);
        }
        repository.deleteById(id);
    }

    private ResultSmsDto convertToDto(ResultSms entity) {
        return ResultSmsDto.builder()
                .id(entity.getId())
                .headOfficeId(entity.getHeadOfficeId())
                .schoolId(entity.getSchoolId())
                .schoolName(entity.getSchoolName())
                .examTerm(entity.getExamTerm())
                .receiverType(entity.getReceiverType())
                .receiver(entity.getReceiver())
                .template(entity.getTemplate())
                .subject(entity.getSubject())
                .smsBody(entity.getSmsBody())
                .sendDate(entity.getSendDate())
                .build();
    }

    private ResultSms convertToEntity(ResultSmsDto dto) {
        return ResultSms.builder()
                .headOfficeId(dto.getHeadOfficeId())
                .schoolId(dto.getSchoolId())
                .schoolName(dto.getSchoolName())
                .examTerm(dto.getExamTerm())
                .receiverType(dto.getReceiverType())
                .receiver(dto.getReceiver())
                .template(dto.getTemplate())
                .subject(dto.getSubject())
                .smsBody(dto.getSmsBody())
                .sendDate(dto.getSendDate())
                .build();
    }
}
