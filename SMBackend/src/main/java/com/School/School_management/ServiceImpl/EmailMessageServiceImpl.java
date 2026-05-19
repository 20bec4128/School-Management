package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.EmailMessageDto;
import com.School.School_management.Entity.EmailMessage;
import com.School.School_management.Repository.EmailMessageRepository;
import com.School.School_management.Service.EmailMessageService;
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
public class EmailMessageServiceImpl implements EmailMessageService {

    @Autowired
    private EmailMessageRepository repository;

    @Autowired
    private EmailMessageDispatchService dispatchService;

    @Override
    public List<EmailMessageDto> list(Long headOfficeId, Long schoolId) {
        return repository.findByScope(headOfficeId, schoolId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<EmailMessageDto> listPaginated(Long headOfficeId, Long schoolId, int page, int size, String search) {
        String cleanSearch = search != null ? search.trim() : "";
        Pageable pageable = PageRequest.of(page, size, Sort.by("sendDate").descending().and(Sort.by("id").descending()));
        return repository.findByScopeWithSearch(headOfficeId, schoolId, cleanSearch, pageable)
                .map(this::convertToDto);
    }

    @Override
    public EmailMessageDto findById(Long id) {
        EmailMessage entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Email record history entry not found for id: " + id));
        return convertToDto(entity);
    }

    @Override
    @Transactional
    public EmailMessageDto create(EmailMessageDto dto) {
        validate(dto);
        EmailMessage entity = convertToEntity(dto);
        EmailMessage saved = repository.save(entity);
        dispatchService.sendAsync(saved);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public EmailMessageDto update(Long id, EmailMessageDto dto) {
        EmailMessage existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Email record history entry not found for id: " + id));
        validate(dto);
        existing.setHeadOfficeId(dto.getHeadOfficeId());
        existing.setSchoolId(dto.getSchoolId());
        existing.setSchoolName(dto.getSchoolName());
        existing.setClassName(dto.getClassName());
        existing.setReceiverType(dto.getReceiverType());
        existing.setReceiver(dto.getReceiver());
        existing.setSubject(dto.getSubject());
        existing.setEmailBody(dto.getEmailBody());
        if (dto.getSendDate() != null) existing.setSendDate(dto.getSendDate());
        EmailMessage updated = repository.save(existing);
        return convertToDto(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Email record history entry not found for id: " + id);
        }
        repository.deleteById(id);
    }

    private void validate(EmailMessageDto dto) {
        if (dto.getSchoolId() == null) {
            throw new IllegalArgumentException("School context scope is required.");
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
        if (dto.getEmailBody() == null || dto.getEmailBody().trim().isEmpty()) {
            throw new IllegalArgumentException("Email body is required.");
        }
    }

    private EmailMessageDto convertToDto(EmailMessage entity) {
        return EmailMessageDto.builder()
                .id(entity.getId())
                .headOfficeId(entity.getHeadOfficeId())
                .schoolId(entity.getSchoolId())
                .schoolName(entity.getSchoolName())
                .className(entity.getClassName())
                .receiverType(entity.getReceiverType())
                .receiver(entity.getReceiver())
                .subject(entity.getSubject())
                .emailBody(entity.getEmailBody())
                .sendDate(entity.getSendDate())
                .build();
    }

    private EmailMessage convertToEntity(EmailMessageDto dto) {
        return EmailMessage.builder()
                .headOfficeId(dto.getHeadOfficeId())
                .schoolId(dto.getSchoolId())
                .schoolName(dto.getSchoolName())
                .className(dto.getClassName())
                .receiverType(dto.getReceiverType())
                .receiver(dto.getReceiver())
                .subject(dto.getSubject())
                .emailBody(dto.getEmailBody())
                .sendDate(dto.getSendDate())
                .build();
    }
}
