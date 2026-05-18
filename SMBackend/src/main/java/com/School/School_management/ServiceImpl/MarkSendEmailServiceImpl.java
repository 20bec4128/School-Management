package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.MarkSendEmailDto;
import com.School.School_management.Entity.MarkSendEmail;
import com.School.School_management.Repository.MarkSendEmailRepository;
import com.School.School_management.Service.MarkSendEmailService;
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
public class MarkSendEmailServiceImpl implements MarkSendEmailService {

    @Autowired
    private MarkSendEmailRepository repository;

    @Override
    public List<MarkSendEmailDto> list(Long headOfficeId, Long schoolId) {
        return repository.findByScope(headOfficeId, schoolId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<MarkSendEmailDto> listPaginated(Long headOfficeId, Long schoolId, int page, int size, String search) {
        String cleanSearch = (search != null) ? search.trim() : "";
        Pageable pageable = PageRequest.of(page, size, Sort.by("sendDate").descending().and(Sort.by("id").descending()));
        return repository.findByScopeWithSearch(headOfficeId, schoolId, cleanSearch, pageable)
                .map(this::convertToDto);
    }

    @Override
    public MarkSendEmailDto findById(Long id) {
        MarkSendEmail entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Email record history entry not found for id: " + id));
        return convertToDto(entity);
    }

    @Override
    @Transactional
    public MarkSendEmailDto create(MarkSendEmailDto dto) {
        if (dto.getSchoolId() == null) {
            throw new IllegalArgumentException("School Context scope is required.");
        }
        if (dto.getSubject() == null || dto.getSubject().trim().isEmpty()) {
            throw new IllegalArgumentException("Email subject cannot be blank.");
        }
        if (dto.getEmailBody() == null || dto.getEmailBody().trim().isEmpty()) {
            throw new IllegalArgumentException("Email text content block body is required.");
        }

        MarkSendEmail entity = convertToEntity(dto);
        MarkSendEmail saved = repository.save(entity);
        
        // Note: Real-world asynchronous outbound SMTP engine dispatch hooks can safely handle `saved` variables downstream here.
        
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public MarkSendEmailDto update(Long id, MarkSendEmailDto dto) {
        MarkSendEmail existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Email record history entry not found for id: " + id));

        existing.setHeadOfficeId(dto.getHeadOfficeId());
        existing.setSchoolId(dto.getSchoolId());
        if (dto.getSchoolName() != null) {
            existing.setSchoolName(dto.getSchoolName());
        }
        existing.setExamTerm(dto.getExamTerm());
        existing.setReceiverType(dto.getReceiverType());
        existing.setStudentMark(dto.getStudentMark());
        existing.setTemplate(dto.getTemplate());
        existing.setSubject(dto.getSubject());
        existing.setEmailBody(dto.getEmailBody());
        
        if (dto.getSendDate() != null) {
            existing.setSendDate(dto.getSendDate());
        }

        MarkSendEmail updated = repository.save(existing);
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

    private MarkSendEmailDto convertToDto(MarkSendEmail entity) {
        return MarkSendEmailDto.builder()
                .id(entity.getId())
                .headOfficeId(entity.getHeadOfficeId())
                .schoolId(entity.getSchoolId())
                .schoolName(entity.getSchoolName())
                .examTerm(entity.getExamTerm())
                .receiverType(entity.getReceiverType())
                .studentMark(entity.getStudentMark())
                .template(entity.getTemplate())
                .subject(entity.getSubject())
                .emailBody(entity.getEmailBody())
                .sendDate(entity.getSendDate())
                .build();
    }

    private MarkSendEmail convertToEntity(MarkSendEmailDto dto) {
        return MarkSendEmail.builder()
                .headOfficeId(dto.getHeadOfficeId())
                .schoolId(dto.getSchoolId())
                .schoolName(dto.getSchoolName())
                .examTerm(dto.getExamTerm())
                .receiverType(dto.getReceiverType())
                .studentMark(dto.getStudentMark())
                .template(dto.getTemplate())
                .subject(dto.getSubject())
                .emailBody(dto.getEmailBody())
                .sendDate(dto.getSendDate())
                .build();
    }
}