package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.SuggestionDto;
import com.School.School_management.Entity.HeadOffice;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.Suggestion;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.HeadOfficeRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.SuggestionRepository;
import com.School.School_management.Service.SuggestionService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@Transactional
public class SuggestionServiceImpl implements SuggestionService {

    private final SuggestionRepository suggestionRepository;
    private final SchoolRepository schoolRepository;
    private final HeadOfficeRepository headOfficeRepository;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public SuggestionServiceImpl(
            SuggestionRepository suggestionRepository,
            SchoolRepository schoolRepository,
            HeadOfficeRepository headOfficeRepository
    ) {
        this.suggestionRepository = suggestionRepository;
        this.schoolRepository = schoolRepository;
        this.headOfficeRepository = headOfficeRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SuggestionDto> list(Long headOfficeId, Long schoolId, String examTerm, String className, String subjectName, String search, CurrentUser user) {
        if (user == null) throw new ForbiddenException();
        Scope scope = resolveScopeForRead(user, headOfficeId, schoolId);
        return filterSuggestions(
                scope.headOfficeId,
                scope.schoolId,
                normalizeFilter(examTerm),
                normalizeFilter(className),
                normalizeFilter(subjectName),
                normalizeFilter(search)
        ).stream().map(this::toDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SuggestionDto> listPaginated(Long headOfficeId, Long schoolId, String examTerm, String className, String subjectName, String search, int page, int size, CurrentUser user) {
        if (user == null) throw new ForbiddenException();
        Scope scope = resolveScopeForRead(user, headOfficeId, schoolId);
        List<SuggestionDto> filtered = filterSuggestions(
                scope.headOfficeId,
                scope.schoolId,
                normalizeFilter(examTerm),
                normalizeFilter(className),
                normalizeFilter(subjectName),
                normalizeFilter(search)
        ).stream().map(this::toDto).toList();

        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        int fromIndex = Math.min(safePage * safeSize, filtered.size());
        int toIndex = Math.min(fromIndex + safeSize, filtered.size());
        List<SuggestionDto> content = filtered.subList(fromIndex, toIndex);
        return new PageImpl<>(content, PageRequest.of(safePage, safeSize, Sort.by("id").descending()), filtered.size());
    }

    @Override
    @Transactional(readOnly = true)
    public SuggestionDto getById(Long id, CurrentUser user) {
        if (user == null) throw new ForbiddenException();
        Suggestion entity = suggestionRepository.findById(id).orElseThrow(NotFoundException::new);
        if (!canAccess(user, entity)) throw new ForbiddenException();
        return toDto(entity);
    }

    @Override
    public SuggestionDto create(SuggestionDto dto, MultipartFile document, CurrentUser user) {
        if (user == null) throw new ForbiddenException();
        Suggestion entity = new Suggestion();
        applyDto(entity, dto, user, document, true);
        return toDto(suggestionRepository.save(entity));
    }

    @Override
    public SuggestionDto update(Long id, SuggestionDto dto, MultipartFile document, CurrentUser user) {
        if (user == null) throw new ForbiddenException();
        Suggestion entity = suggestionRepository.findById(id).orElseThrow(NotFoundException::new);
        if (!canAccess(user, entity)) throw new ForbiddenException();
        applyDto(entity, dto, user, document, false);
        return toDto(suggestionRepository.save(entity));
    }

    @Override
    public void delete(Long id, CurrentUser user) {
        if (user == null) throw new ForbiddenException();
        Suggestion entity = suggestionRepository.findById(id).orElseThrow(NotFoundException::new);
        if (!canAccess(user, entity)) throw new ForbiddenException();
        suggestionRepository.delete(entity);
    }

    private void applyDto(Suggestion entity, SuggestionDto dto, CurrentUser user, MultipartFile document, boolean creating) {
        if (dto == null) throw new BadRequestException("Suggestion data is required");

        Long requestedSchoolId = dto.getSchoolId();
        Long requestedHeadOfficeId = dto.getHeadOfficeId();
        Scope scope = resolveScopeForWrite(user, requestedHeadOfficeId, requestedSchoolId);
        ManageSchool school = resolveSchool(scope.schoolId);
        Long effectiveHeadOfficeId = resolveHeadOfficeId(school, scope.headOfficeId);

        entity.setHeadOfficeId(effectiveHeadOfficeId);
        entity.setSchoolId(school.getId());
        entity.setTitle(required(dto.getTitle(), "Title is required"));
        entity.setExamTerm(required(dto.getExamTerm(), "Exam term is required"));
        entity.setClassName(required(dto.getClassName(), "Class is required"));
        entity.setSubjectName(required(dto.getSubjectName(), "Subject is required"));
        entity.setSuggestionText(required(dto.getSuggestionText(), "Suggestion is required"));
        entity.setNote(normalizeOptional(dto.getNote()));

        if (document != null && !document.isEmpty()) {
            saveDocument(entity, document);
        } else if (Boolean.TRUE.equals(dto.getRemoveDocument())) {
            entity.setDocumentName(null);
            entity.setDocumentType(null);
            entity.setDocumentPath(null);
        } else if (creating) {
            entity.setDocumentName(null);
            entity.setDocumentType(null);
            entity.setDocumentPath(null);
        }
    }

    private List<Suggestion> filterSuggestions(Long headOfficeId, Long schoolId, String examTerm, String className, String subjectName, String search) {
        String searchTerm = normalizeFilter(search);
        return suggestionRepository.findAll(Sort.by("id").descending()).stream()
                .filter(suggestion -> headOfficeId == null || Objects.equals(headOfficeId, suggestion.getHeadOfficeId()))
                .filter(suggestion -> schoolId == null || Objects.equals(schoolId, suggestion.getSchoolId()))
                .filter(suggestion -> examTerm == null || equalsIgnoreCase(suggestion.getExamTerm(), examTerm))
                .filter(suggestion -> className == null || equalsIgnoreCase(suggestion.getClassName(), className))
                .filter(suggestion -> subjectName == null || equalsIgnoreCase(suggestion.getSubjectName(), subjectName))
                .filter(suggestion -> searchTerm == null || containsSearch(suggestion, searchTerm))
                .toList();
    }

    private void saveDocument(Suggestion entity, MultipartFile document) {
        try {
            Path folderPath = Paths.get(uploadDir, "suggestions");
            Files.createDirectories(folderPath);

            String originalName = document.getOriginalFilename();
            String storedName = UUID.randomUUID() + "_" + originalName;
            Path filePath = folderPath.resolve(storedName);
            Files.copy(document.getInputStream(), filePath);

            String relativePath = Paths.get(uploadDir, "suggestions", storedName).toString().replace("\\", "/");
            entity.setDocumentName(originalName);
            entity.setDocumentType(document.getContentType());
            entity.setDocumentPath(relativePath);
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload suggestion document");
        }
    }

    private boolean canAccess(CurrentUser user, Suggestion entity) {
        if (user == null || entity == null) return false;
        if (user.isSuperAdmin() || user.adminId() != null) return true;
        if (user.isSchoolScoped()) {
            return user.schoolId() != null && Objects.equals(user.schoolId(), entity.getSchoolId());
        }
        if (user.isHeadOfficeScopedAdmin()) {
            return user.headOfficeId() != null && Objects.equals(user.headOfficeId(), entity.getHeadOfficeId());
        }
        return false;
    }

    private Scope resolveScopeForRead(CurrentUser user, Long requestedHeadOfficeId, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return new Scope(null, user.schoolId());
        }
        if (user.isHeadOfficeScopedAdmin()) {
            if (requestedSchoolId != null) {
                ensureSchoolInHeadOffice(requestedSchoolId, user.headOfficeId());
                return new Scope(user.headOfficeId(), requestedSchoolId);
            }
            Long effectiveHeadOfficeId = requestedHeadOfficeId != null ? requestedHeadOfficeId : user.headOfficeId();
            if (effectiveHeadOfficeId == null) throw new BadRequestException("headOfficeId is required");
            if (!Objects.equals(effectiveHeadOfficeId, user.headOfficeId())) throw new ForbiddenException();
            return new Scope(effectiveHeadOfficeId, null);
        }
        return new Scope(requestedHeadOfficeId, requestedSchoolId);
    }

    private Scope resolveScopeForWrite(CurrentUser user, Long requestedHeadOfficeId, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return new Scope(null, user.schoolId());
        }
        if (user.isHeadOfficeScopedAdmin()) {
            if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
            ensureSchoolInHeadOffice(requestedSchoolId, user.headOfficeId());
            return new Scope(user.headOfficeId(), requestedSchoolId);
        }
        if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
        return new Scope(requestedHeadOfficeId, requestedSchoolId);
    }

    private void ensureSchoolInHeadOffice(Long schoolId, Long headOfficeId) {
        if (!schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isPresent()) {
            throw new NotFoundException();
        }
    }

    private ManageSchool resolveSchool(Long schoolId) {
        if (schoolId == null) throw new BadRequestException("schoolId is required");
        return schoolRepository.findById(schoolId).orElseThrow(NotFoundException::new);
    }

    private Long resolveHeadOfficeId(ManageSchool school, Long requestedHeadOfficeId) {
        Long schoolHeadOfficeId = school.getHeadOfficeId();
        if (schoolHeadOfficeId != null && requestedHeadOfficeId != null && !Objects.equals(schoolHeadOfficeId, requestedHeadOfficeId)) {
            throw new BadRequestException("Selected school does not belong to the requested head office");
        }
        if (schoolHeadOfficeId != null) return schoolHeadOfficeId;
        if (requestedHeadOfficeId != null) return requestedHeadOfficeId;
        throw new BadRequestException("headOfficeId is required");
    }

    private SuggestionDto toDto(Suggestion entity) {
        SuggestionDto dto = new SuggestionDto();
        dto.setId(entity.getId());
        dto.setHeadOfficeId(entity.getHeadOfficeId());
        if (entity.getHeadOfficeId() != null) {
            HeadOffice headOffice = headOfficeRepository.findById(entity.getHeadOfficeId()).orElse(null);
            dto.setHeadOfficeName(headOffice == null ? null : headOffice.getName());
        }
        dto.setSchoolId(entity.getSchoolId());
        if (entity.getSchoolId() != null) {
            ManageSchool school = schoolRepository.findById(entity.getSchoolId()).orElse(null);
            dto.setSchoolName(school == null ? null : school.getSchoolName());
        }
        dto.setTitle(entity.getTitle());
        dto.setExamTerm(entity.getExamTerm());
        dto.setClassName(entity.getClassName());
        dto.setSubjectName(entity.getSubjectName());
        dto.setSuggestionText(entity.getSuggestionText());
        dto.setDocumentName(entity.getDocumentName());
        dto.setDocumentType(entity.getDocumentType());
        dto.setDocumentPath(entity.getDocumentPath());
        if (entity.getDocumentPath() != null) {
            dto.setDocumentUrl("/" + normalizePath(entity.getDocumentPath()));
        }
        dto.setNote(entity.getNote());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    private String normalizePath(String path) {
        return path == null ? null : path.replace("\\", "/");
    }

    private String required(String value, String message) {
        String normalized = normalizeOptional(value);
        if (normalized == null) throw new BadRequestException(message);
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeFilter(String value) {
        String normalized = normalizeOptional(value);
        if (normalized == null) return null;
        if ("Select".equalsIgnoreCase(normalized)) return null;
        return normalized;
    }

    private boolean equalsIgnoreCase(String left, String right) {
        if (left == null || right == null) return false;
        return left.trim().equalsIgnoreCase(right.trim());
    }

    private boolean containsSearch(Suggestion suggestion, String search) {
        String content = String.join(" ",
                normalizeOptional(suggestion.getTitle()) == null ? "" : suggestion.getTitle(),
                normalizeOptional(suggestion.getExamTerm()) == null ? "" : suggestion.getExamTerm(),
                normalizeOptional(suggestion.getClassName()) == null ? "" : suggestion.getClassName(),
                normalizeOptional(suggestion.getSubjectName()) == null ? "" : suggestion.getSubjectName(),
                normalizeOptional(suggestion.getSuggestionText()) == null ? "" : suggestion.getSuggestionText(),
                normalizeOptional(suggestion.getNote()) == null ? "" : suggestion.getNote()
        ).toLowerCase();
        return content.contains(search.toLowerCase());
    }

    private record Scope(Long headOfficeId, Long schoolId) {}
}
