package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.OnlineExamDto;
import com.School.School_management.Entity.*;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.*;
import com.School.School_management.Service.OnlineExamService;
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
public class OnlineExamServiceImpl implements OnlineExamService {

    private final OnlineExamRepository repository;
    private final SchoolRepository schoolRepository;
    private final SchoolClassRepository classRepository;
    private final SchoolSectionRepository sectionRepository;
    private final SubjectRepository subjectRepository;

    public OnlineExamServiceImpl(OnlineExamRepository repository, SchoolRepository schoolRepository, SchoolClassRepository classRepository, SchoolSectionRepository sectionRepository, SubjectRepository subjectRepository) {
        this.repository = repository;
        this.schoolRepository = schoolRepository;
        this.classRepository = classRepository;
        this.sectionRepository = sectionRepository;
        this.subjectRepository = subjectRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<OnlineExamDto> list(Long headOfficeId, Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        List<OnlineExam> rows = resolveVisibleRows(user, headOfficeId, schoolId);
        return rows.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OnlineExamDto> listPaginated(Long headOfficeId, Long schoolId, Long classId, Long subjectId, String isPublish, int page, int size, String search) {
        List<OnlineExamDto> all = list(headOfficeId, schoolId);
        
        String q = search == null ? "" : search.trim().toLowerCase();
        List<OnlineExamDto> filtered = all.stream()
                .filter(row -> classId == null || Objects.equals(row.getClassId(), classId))
                .filter(row -> subjectId == null || Objects.equals(row.getSubjectId(), subjectId))
                .filter(row -> isPublish == null || isPublish.equalsIgnoreCase("Select") || row.getIsPublish().equalsIgnoreCase(isPublish))
                .filter(row -> q.isEmpty() || (row.getExamTitle() != null && row.getExamTitle().toLowerCase().contains(q)))
                .collect(Collectors.toList());

        int start = page * size;
        int end = Math.min(start + size, filtered.size());
        List<OnlineExamDto> content = (start < filtered.size()) ? filtered.subList(start, end) : List.of();
        
        return new PageImpl<>(content, PageRequest.of(page, size), filtered.size());
    }

    @Override
    public OnlineExamDto create(OnlineExamDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto.getSchoolId());
        OnlineExam entity = new OnlineExam();
        entity.setSchool(resolveSchool(effectiveSchoolId));
        entity.setSchoolClass(resolveClass(dto.getClassId()));
        entity.setSection(resolveSection(dto.getSectionId()));
        entity.setSubject(resolveSubject(dto.getSubjectId()));
        entity.setExamTitle(dto.getExamTitle());
        entity.setInstruction(dto.getInstruction());
        entity.setDuration(dto.getDuration());
        entity.setStartDate(dto.getStartDate());
        entity.setEndDate(dto.getEndDate());
        entity.setMarkType(dto.getMarkType());
        entity.setPassMark(dto.getPassMark());
        entity.setIsPublish(dto.getIsPublish() == null ? "Draft" : dto.getIsPublish());
        entity.setExamLimit(dto.getExamLimit());
        entity.setNote(dto.getNote());
        return toDto(repository.save(entity));
    }

    @Override
    public OnlineExamDto update(Long id, OnlineExamDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        OnlineExam entity = repository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto.getSchoolId());
        if (!Objects.equals(entity.getSchool().getId(), effectiveSchoolId) && !user.isSuperAdmin()) throw new ForbiddenException();

        entity.setSchoolClass(resolveClass(dto.getClassId()));
        entity.setSection(resolveSection(dto.getSectionId()));
        entity.setSubject(resolveSubject(dto.getSubjectId()));
        entity.setExamTitle(dto.getExamTitle());
        entity.setInstruction(dto.getInstruction());
        entity.setDuration(dto.getDuration());
        entity.setStartDate(dto.getStartDate());
        entity.setEndDate(dto.getEndDate());
        entity.setMarkType(dto.getMarkType());
        entity.setPassMark(dto.getPassMark());
        if (dto.getIsPublish() != null) entity.setIsPublish(dto.getIsPublish());
        entity.setExamLimit(dto.getExamLimit());
        entity.setNote(dto.getNote());
        
        return toDto(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        OnlineExam entity = repository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, entity.getSchool().getId());
        if (!Objects.equals(entity.getSchool().getId(), effectiveSchoolId) && !user.isSuperAdmin()) throw new ForbiddenException();

        entity.setDeleted(true);
        repository.save(entity);
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

    private List<OnlineExam> resolveVisibleRows(CurrentUser user, Long headOfficeId, Long schoolId) {
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

    private void ensureSchoolInHeadOffice(Long schoolId, Long headOfficeId) {
        if (schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isEmpty()) {
            throw new NotFoundException("School not found in your head office");
        }
    }

    private ManageSchool resolveSchool(Long schoolId) {
        return schoolRepository.findById(schoolId).orElseThrow(NotFoundException::new);
    }

    private SchoolClass resolveClass(Long id) {
        if (id == null) return null;
        return classRepository.findById(id).orElseThrow(NotFoundException::new);
    }

    private SchoolSection resolveSection(Long id) {
        if (id == null) return null;
        return sectionRepository.findById(id).orElseThrow(NotFoundException::new);
    }

    private Subject resolveSubject(Long id) {
        if (id == null) return null;
        return subjectRepository.findById(id).orElseThrow(NotFoundException::new);
    }

    private OnlineExamDto toDto(OnlineExam entity) {
        OnlineExamDto dto = new OnlineExamDto();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchool().getId());
        dto.setSchoolName(entity.getSchool().getSchoolName());
        dto.setClassId(entity.getSchoolClass() != null ? entity.getSchoolClass().getId() : null);
        dto.setClassName(entity.getSchoolClass() != null ? entity.getSchoolClass().getClassName() : null);
        dto.setSectionId(entity.getSection() != null ? entity.getSection().getId() : null);
        dto.setSectionName(entity.getSection() != null ? entity.getSection().getName() : null);
        dto.setSubjectId(entity.getSubject() != null ? entity.getSubject().getId() : null);
        dto.setSubjectName(entity.getSubject() != null ? entity.getSubject().getName() : null);
        dto.setExamTitle(entity.getExamTitle());
        dto.setInstruction(entity.getInstruction());
        dto.setDuration(entity.getDuration());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setMarkType(entity.getMarkType());
        dto.setPassMark(entity.getPassMark());
        dto.setIsPublish(entity.getIsPublish());
        dto.setExamLimit(entity.getExamLimit());
        dto.setNote(entity.getNote());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
