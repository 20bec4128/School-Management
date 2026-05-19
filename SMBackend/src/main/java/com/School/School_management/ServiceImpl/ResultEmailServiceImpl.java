package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.ResultEmailDto;
import com.School.School_management.Entity.ResultEmail;
import com.School.School_management.Repository.ResultEmailRepository;
import com.School.School_management.Service.ResultEmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ResultEmailServiceImpl implements ResultEmailService {

    @Autowired
    private ResultEmailRepository repository;

    @Autowired
    private ResultEmailDispatchService dispatchService;

    @Override
    public List<ResultEmailDto> list(Long headOfficeId, Long schoolId) {
        return repository.findByScope(headOfficeId, schoolId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<ResultEmailDto> listPaginated(Long headOfficeId, Long schoolId, int page, int size, String search) {
        String cleanSearch = (search != null) ? search.trim() : "";
        Pageable pageable = PageRequest.of(page, size, Sort.by("sendDate").descending().and(Sort.by("id").descending()));
        return repository.findByScopeWithSearch(headOfficeId, schoolId, cleanSearch, pageable)
                .map(this::convertToDto);
    }

    @Override
    public ResultEmailDto findById(Long id) {
        ResultEmail entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Result email history entry not found for id: " + id));
        return convertToDto(entity);
    }

    @Override
    @Transactional
    public ResultEmailDto create(ResultEmailDto dto) {
        if (dto.getSchoolId() == null) {
            throw new IllegalArgumentException("School context scope is required.");
        }
        if (dto.getExamTerm() == null || dto.getExamTerm().trim().isEmpty()) {
            throw new IllegalArgumentException("Exam term is required.");
        }
        if (dto.getReceiverType() == null || dto.getReceiverType().trim().isEmpty()) {
            throw new IllegalArgumentException("Receiver type is required.");
        }
        if (dto.getSubject() == null || dto.getSubject().trim().isEmpty()) {
            throw new IllegalArgumentException("Subject is required.");
        }
        if (dto.getEmailBody() == null || dto.getEmailBody().trim().isEmpty()) {
            throw new IllegalArgumentException("Email body is required.");
        }

        List<String> receivers = resolveReceivers(dto);
        if (receivers.isEmpty()) {
            throw new IllegalArgumentException("Receiver is required.");
        }

        ResultEmailDto lastSaved = null;
        for (String receiver : receivers) {
            ResultEmailDto perReceiverDto = copyForReceiver(dto, receiver);
            ResultEmail entity = convertToEntity(perReceiverDto);
            ResultEmail saved = repository.save(entity);
            dispatchService.sendAsync(saved);
            lastSaved = convertToDto(saved);
        }
        return lastSaved;
    }

    @Override
    @Transactional
    public ResultEmailDto update(Long id, ResultEmailDto dto) {
        ResultEmail existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Result email history entry not found for id: " + id));

        if (dto.getSchoolId() == null) {
            throw new IllegalArgumentException("School context scope is required.");
        }
        if (dto.getExamTerm() == null || dto.getExamTerm().trim().isEmpty()) {
            throw new IllegalArgumentException("Exam term is required.");
        }
        if (dto.getReceiverType() == null || dto.getReceiverType().trim().isEmpty()) {
            throw new IllegalArgumentException("Receiver type is required.");
        }
        if (dto.getSubject() == null || dto.getSubject().trim().isEmpty()) {
            throw new IllegalArgumentException("Subject is required.");
        }
        if (dto.getEmailBody() == null || dto.getEmailBody().trim().isEmpty()) {
            throw new IllegalArgumentException("Email body is required.");
        }

        existing.setHeadOfficeId(dto.getHeadOfficeId());
        existing.setSchoolId(dto.getSchoolId());
        existing.setSchoolName(dto.getSchoolName());
        existing.setExamTerm(dto.getExamTerm());
        existing.setReceiverType(dto.getReceiverType());
        existing.setReceiver(dto.getReceiver());
        existing.setTemplate(dto.getTemplate());
        existing.setSubject(dto.getSubject());
        existing.setEmailBody(dto.getEmailBody());
        
        if (dto.getSendDate() != null) {
            existing.setSendDate(dto.getSendDate());
        }

        ResultEmail updated = repository.save(existing);
        return convertToDto(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Result email history entry not found for id: " + id);
        }
        repository.deleteById(id);
    }

    private ResultEmailDto convertToDto(ResultEmail entity) {
        return ResultEmailDto.builder()
                .id(entity.getId())
                .headOfficeId(entity.getHeadOfficeId())
                .schoolId(entity.getSchoolId())
                .schoolName(entity.getSchoolName())
                .examTerm(entity.getExamTerm())
                .receiverType(entity.getReceiverType())
                .receiver(entity.getReceiver())
                .receivers(null)
                .template(entity.getTemplate())
                .subject(entity.getSubject())
                .emailBody(entity.getEmailBody())
                .sendDate(entity.getSendDate())
                .build();
    }

    private ResultEmail convertToEntity(ResultEmailDto dto) {
        return ResultEmail.builder()
                .headOfficeId(dto.getHeadOfficeId())
                .schoolId(dto.getSchoolId())
                .schoolName(dto.getSchoolName())
                .examTerm(dto.getExamTerm())
                .receiverType(dto.getReceiverType())
                .receiver(dto.getReceiver())
                .template(dto.getTemplate())
                .subject(dto.getSubject())
                .emailBody(dto.getEmailBody())
                .sendDate(dto.getSendDate())
                .build();
    }

    private List<String> resolveReceivers(ResultEmailDto dto) {
        if (dto.getReceivers() != null && !dto.getReceivers().isEmpty()) {
            return dto.getReceivers().stream()
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(value -> !value.isEmpty())
                    .distinct()
                    .collect(Collectors.toList());
        }

        if (dto.getReceiver() != null && !dto.getReceiver().trim().isEmpty()) {
            return List.of(dto.getReceiver().trim());
        }

        return List.of();
    }

    private ResultEmailDto copyForReceiver(ResultEmailDto dto, String receiver) {
        return ResultEmailDto.builder()
                .id(dto.getId())
                .headOfficeId(dto.getHeadOfficeId())
                .schoolId(dto.getSchoolId())
                .schoolName(dto.getSchoolName())
                .examTerm(dto.getExamTerm())
                .receiverType(dto.getReceiverType())
                .receiver(receiver)
                .template(dto.getTemplate())
                .subject(dto.getSubject())
                .emailBody(dto.getEmailBody())
                .sendDate(dto.getSendDate())
                .build();
    }
}
