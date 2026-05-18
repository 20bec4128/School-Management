package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.ExamInstructionDto;
import com.School.School_management.Entity.ExamInstruction;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.ExamInstructionRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.ExamInstructionService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ExamInstructionServiceImpl implements ExamInstructionService {

    private final ExamInstructionRepository repository;
    private final SchoolRepository schoolRepository;

    public ExamInstructionServiceImpl(ExamInstructionRepository repository, SchoolRepository schoolRepository) {
        this.repository = repository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamInstructionDto> list(Long headOfficeId, Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        List<ExamInstruction> rows = resolveVisibleRows(user, headOfficeId, schoolId);
        return rows.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ExamInstructionDto> listPaginated(Long headOfficeId, Long schoolId, String status, int page, int size, String search) {
        List<ExamInstructionDto> all = list(headOfficeId, schoolId);
        
        String q = search == null ? "" : search.trim().toLowerCase();
        List<ExamInstructionDto> filtered = all.stream()
                .filter(row -> status == null || status.equalsIgnoreCase("Select") || row.getStatus().equalsIgnoreCase(status))
                .filter(row -> q.isEmpty() || (row.getTitle() != null && row.getTitle().toLowerCase().contains(q)) 
                        || (row.getInstruction() != null && row.getInstruction().toLowerCase().contains(q)))
                .collect(Collectors.toList());

        int start = page * size;
        int end = Math.min(start + size, filtered.size());
        List<ExamInstructionDto> content = (start < filtered.size()) ? filtered.subList(start, end) : List.of();
        
        return new PageImpl<>(content, PageRequest.of(page, size), filtered.size());
    }

    @Override
    public ExamInstructionDto create(ExamInstructionDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto.getSchoolId());
        ExamInstruction entity = new ExamInstruction();
        entity.setSchool(resolveSchool(effectiveSchoolId));
        entity.setTitle(dto.getTitle());
        entity.setInstruction(dto.getInstruction());
        entity.setStatus(dto.getStatus() == null ? "Active" : dto.getStatus());
        return toDto(repository.save(entity));
    }

    @Override
    public ExamInstructionDto update(Long id, ExamInstructionDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        ExamInstruction entity = repository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto.getSchoolId());
        if (!Objects.equals(entity.getSchool().getId(), effectiveSchoolId) && !user.isSuperAdmin()) throw new ForbiddenException();

        entity.setTitle(dto.getTitle());
        entity.setInstruction(dto.getInstruction());
        if (dto.getStatus() != null) entity.setStatus(dto.getStatus());
        
        return toDto(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        ExamInstruction entity = repository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, entity.getSchool().getId());
        if (!Objects.equals(entity.getSchool().getId(), effectiveSchoolId) && !user.isSuperAdmin()) throw new ForbiddenException();

        entity.setDeleted(true);
        repository.save(entity);
    }

    private List<ExamInstruction> resolveVisibleRows(CurrentUser user, Long headOfficeId, Long schoolId) {
        if (user.isSchoolScoped()) {
            Long effectiveSchoolId = user.schoolId();
            if (schoolId != null && !Objects.equals(schoolId, effectiveSchoolId)) {
                throw new ForbiddenException();
            }
            if (headOfficeId != null) {
                ensureSchoolInHeadOffice(effectiveSchoolId, headOfficeId);
            }
            return repository.findBySchool_IdAndDeletedFalseOrderByIdDesc(effectiveSchoolId);
        }

        if (schoolId != null) {
            if (user.isHeadOfficeScopedAdmin()) {
                ensureSchoolInHeadOffice(schoolId, user.headOfficeId());
            }
            return repository.findBySchool_IdAndDeletedFalseOrderByIdDesc(schoolId);
        }

        if (headOfficeId != null) {
            if (user.isHeadOfficeScopedAdmin() && !Objects.equals(headOfficeId, user.headOfficeId())) {
                throw new ForbiddenException();
            }
            return repository.findBySchool_HeadOfficeIdAndDeletedFalseOrderByIdDesc(headOfficeId);
        }

        if (user.isHeadOfficeScopedAdmin()) {
            return repository.findBySchool_HeadOfficeIdAndDeletedFalseOrderByIdDesc(user.headOfficeId());
        }

        if (user.isSuperAdmin()) {
            return repository.findAllByDeletedFalseOrderByIdDesc();
        }

        throw new BadRequestException("schoolId is required");
    }

    private Long effectiveSchoolIdForRead(CurrentUser user, Long requestedSchoolId) {
        if (user.isSchoolScoped()) return user.schoolId();
        if (user.isHeadOfficeScopedAdmin()) {
            if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
            ensureSchoolInHeadOffice(requestedSchoolId, user.headOfficeId());
            return requestedSchoolId;
        }
        if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
        return requestedSchoolId;
    }

    private Long effectiveSchoolIdForWrite(CurrentUser user, Long requestedSchoolId) {
        return effectiveSchoolIdForRead(user, requestedSchoolId);
    }

    private void ensureSchoolInHeadOffice(Long schoolId, Long headOfficeId) {
        if (schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isEmpty()) {
            throw new NotFoundException("School not found in your head office");
        }
    }

    private ManageSchool resolveSchool(Long schoolId) {
        return schoolRepository.findById(schoolId).orElseThrow(NotFoundException::new);
    }

    private ExamInstructionDto toDto(ExamInstruction entity) {
        ExamInstructionDto dto = new ExamInstructionDto();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchool().getId());
        dto.setSchoolName(entity.getSchool().getSchoolName());
        dto.setTitle(entity.getTitle());
        dto.setInstruction(entity.getInstruction());
        dto.setStatus(entity.getStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
