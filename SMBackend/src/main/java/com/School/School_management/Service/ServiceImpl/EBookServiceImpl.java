package com.School.School_management.Service.ServiceImpl;

import com.School.School_management.Dto.EBookDto;
import com.School.School_management.Entity.EBook;
import com.School.School_management.Entity.HeadOffice;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.SchoolClass;
import com.School.School_management.Entity.Subject;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.EBookRepository;
import com.School.School_management.Repository.HeadOfficeRepository;
import com.School.School_management.Repository.SchoolClassRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.SubjectRepository;
import com.School.School_management.Service.EBookService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.config.UploadProperties;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Objects;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
public class EBookServiceImpl implements EBookService {

    private static final String SUBJECT_TYPE = "SUBJECT";
    private static final String GENERAL_TYPE = "GENERAL";

    private final EBookRepository eBookRepository;
    private final SchoolRepository schoolRepository;
    private final HeadOfficeRepository headOfficeRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SubjectRepository subjectRepository;
    private final UploadProperties uploadProperties;

    public EBookServiceImpl(
            EBookRepository eBookRepository,
            SchoolRepository schoolRepository,
            HeadOfficeRepository headOfficeRepository,
            SchoolClassRepository schoolClassRepository,
            SubjectRepository subjectRepository,
            UploadProperties uploadProperties
    ) {
        this.eBookRepository = eBookRepository;
        this.schoolRepository = schoolRepository;
        this.headOfficeRepository = headOfficeRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.subjectRepository = subjectRepository;
        this.uploadProperties = uploadProperties;
    }

    @Override
    public Page<EBookDto> list(Long headOfficeId, Long schoolId, String ebookType, Long classId, String language, String search, int page, int size, CurrentUser user) {
        ResolvedScope scope = resolveListScope(user, headOfficeId, schoolId, classId);
        String normalizedSearch = normalizeSearch(search);
        String normalizedLanguage = normalizeLanguage(language);
        String normalizedType = normalizeType(ebookType);
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id"));
        return eBookRepository.searchEBooks(scope.headOfficeId(), scope.schoolId(), normalizedType, scope.classId(), normalizedLanguage, normalizedSearch, pageable)
                .map(this::toDto);
    }

    @Override
    public EBookDto create(EBookDto dto, MultipartFile ebookFile, CurrentUser user) {
        ResolvedWriteScope scope = resolveWriteScope(user, dto);
        EBook ebook = new EBook();
        applyDto(ebook, scope);
        saveFile(ebook, ebookFile);
        return toDto(eBookRepository.save(ebook));
    }

    @Override
    public EBookDto update(Long id, EBookDto dto, MultipartFile ebookFile, CurrentUser user) {
        EBook ebook = eBookRepository.findById(id).orElseThrow(NotFoundException::new);
        ensureVisibleToUser(ebook, user);

        EBookDto merged = merge(ebook, dto);
        ResolvedWriteScope scope = resolveWriteScope(user, merged);
        applyDto(ebook, scope);
        if (ebookFile != null && !ebookFile.isEmpty()) {
            saveFile(ebook, ebookFile);
        }
        return toDto(eBookRepository.save(ebook));
    }

    @Override
    public void delete(Long id, CurrentUser user) {
        EBook ebook = eBookRepository.findById(id).orElseThrow(NotFoundException::new);
        ensureVisibleToUser(ebook, user);
        eBookRepository.delete(ebook);
    }

    private ResolvedScope resolveListScope(CurrentUser user, Long requestedHeadOfficeId, Long requestedSchoolId, Long requestedClassId) {
        if (user == null) {
            throw new ForbiddenException();
        }

        if (user.isSuperAdmin()) {
            if (requestedClassId != null) {
                SchoolClass schoolClass = requireClass(requestedClassId);
                Long resolvedSchoolId = schoolClass.getSchool() == null ? null : schoolClass.getSchool().getId();
                Long resolvedHeadOfficeId = schoolClass.getSchool() == null ? null : schoolClass.getSchool().getHeadOfficeId();
                if (requestedSchoolId != null && !Objects.equals(requestedSchoolId, resolvedSchoolId)) {
                    throw new BadRequestException("Class does not belong to the selected school");
                }
                if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, resolvedHeadOfficeId)) {
                    throw new BadRequestException("Class does not belong to the selected head office");
                }
                return new ResolvedScope(resolvedHeadOfficeId, resolvedSchoolId, schoolClass.getId());
            }
            if (requestedSchoolId != null) {
                ManageSchool school = requireSchool(requestedSchoolId);
                if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
                    throw new BadRequestException("School does not belong to the selected head office");
                }
                return new ResolvedScope(school.getHeadOfficeId(), school.getId(), null);
            }
            return new ResolvedScope(normalizeId(requestedHeadOfficeId), null, null);
        }

        if (user.isHeadOfficeScopedAdmin()) {
            Long authHeadOfficeId = user.headOfficeId();
            if (requestedHeadOfficeId != null && !Objects.equals(authHeadOfficeId, requestedHeadOfficeId)) {
                throw new ForbiddenException();
            }
            if (requestedClassId != null) {
                SchoolClass schoolClass = requireClass(requestedClassId);
                Long resolvedSchoolId = schoolClass.getSchool() == null ? null : schoolClass.getSchool().getId();
                Long resolvedHeadOfficeId = schoolClass.getSchool() == null ? null : schoolClass.getSchool().getHeadOfficeId();
                if (!Objects.equals(authHeadOfficeId, resolvedHeadOfficeId)) {
                    throw new BadRequestException("Class does not belong to your head office");
                }
                if (requestedSchoolId != null && !Objects.equals(requestedSchoolId, resolvedSchoolId)) {
                    throw new BadRequestException("Class does not belong to the selected school");
                }
                return new ResolvedScope(authHeadOfficeId, resolvedSchoolId, schoolClass.getId());
            }
            if (requestedSchoolId != null) {
                ManageSchool school = requireSchool(requestedSchoolId);
                if (!Objects.equals(authHeadOfficeId, school.getHeadOfficeId())) {
                    throw new BadRequestException("School does not belong to your head office");
                }
                return new ResolvedScope(authHeadOfficeId, school.getId(), null);
            }
            return new ResolvedScope(authHeadOfficeId, null, null);
        }

        if (user.isSchoolScopedAdminUser()) {
            ManageSchool school = requireSchool(user.schoolId());
            if (requestedSchoolId != null && !Objects.equals(user.schoolId(), requestedSchoolId)) {
                throw new ForbiddenException();
            }
            if (requestedHeadOfficeId != null && !Objects.equals(school.getHeadOfficeId(), requestedHeadOfficeId)) {
                throw new ForbiddenException();
            }
            if (requestedClassId != null) {
                SchoolClass schoolClass = requireClass(requestedClassId);
                Long resolvedSchoolId = schoolClass.getSchool() == null ? null : schoolClass.getSchool().getId();
                if (!Objects.equals(resolvedSchoolId, user.schoolId())) {
                    throw new ForbiddenException();
                }
                return new ResolvedScope(school.getHeadOfficeId(), school.getId(), schoolClass.getId());
            }
            return new ResolvedScope(school.getHeadOfficeId(), school.getId(), null);
        }

        throw new ForbiddenException();
    }

    private ResolvedWriteScope resolveWriteScope(CurrentUser user, EBookDto dto) {
        if (user == null) {
            throw new ForbiddenException();
        }

        Long requestedHeadOfficeId = normalizeId(dto == null ? null : dto.getHeadOfficeId());
        Long requestedSchoolId = normalizeId(dto == null ? null : dto.getSchoolId());
        Long schoolId = requiredId(requestedSchoolId, "School is required");
        ManageSchool school = requireSchool(schoolId);
        validateSchoolScope(requestedHeadOfficeId, school);

        String ebookType = normalizeType(dto == null ? null : dto.getEbookType());
        if (ebookType == null) {
            ebookType = SUBJECT_TYPE;
        }

        String ebookName = requiredText(dto == null ? null : dto.getEbookName(), "Name is required");
        String edition = normalizeOptional(dto == null ? null : dto.getEdition());
        String author = normalizeOptional(dto == null ? null : dto.getAuthor());
        String language = normalizeOptional(dto == null ? null : dto.getLanguage());
        String coverImage = normalizeOptional(dto == null ? null : dto.getCoverImage());

        Long classId = null;
        Long subjectId = null;
        if (SUBJECT_TYPE.equals(ebookType)) {
            classId = requiredId(normalizeId(dto == null ? null : dto.getClassId()), "Class is required for subject e-books");
            subjectId = requiredId(normalizeId(dto == null ? null : dto.getSubjectId()), "Subject is required for subject e-books");
            SchoolClass schoolClass = requireClass(classId);
            if (!Objects.equals(schoolClass.getSchool() == null ? null : schoolClass.getSchool().getId(), school.getId())) {
                throw new BadRequestException("Class does not belong to the selected school");
            }
            if (!subjectRepository.existsByIdAndSchool_IdAndSchoolClass_Id(subjectId, school.getId(), classId)) {
                throw new BadRequestException("Subject does not belong to the selected class and school");
            }
        }

        if (user.isSuperAdmin()) {
            return new ResolvedWriteScope(school.getHeadOfficeId(), school.getId(), ebookType, classId, subjectId, ebookName, edition, author, language, coverImage);
        }

        if (user.isHeadOfficeScopedAdmin()) {
            Long authHeadOfficeId = user.headOfficeId();
            if (!Objects.equals(authHeadOfficeId, school.getHeadOfficeId())) {
                throw new BadRequestException("School does not belong to your head office");
            }
            return new ResolvedWriteScope(authHeadOfficeId, school.getId(), ebookType, classId, subjectId, ebookName, edition, author, language, coverImage);
        }

        if (user.isSchoolScopedAdminUser()) {
            Long authSchoolId = user.schoolId();
            if (!Objects.equals(authSchoolId, school.getId())) {
                throw new ForbiddenException();
            }
            if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
                throw new ForbiddenException();
            }
            return new ResolvedWriteScope(school.getHeadOfficeId(), school.getId(), ebookType, classId, subjectId, ebookName, edition, author, language, coverImage);
        }

        throw new ForbiddenException();
    }

    private void applyDto(EBook ebook, ResolvedWriteScope scope) {
        ebook.setHeadOfficeId(scope.headOfficeId());
        ebook.setSchoolId(scope.schoolId());
        ebook.setEbookType(scope.ebookType());
        ebook.setClassId(scope.classId());
        ebook.setSubjectId(scope.subjectId());
        ebook.setEbookName(scope.ebookName());
        ebook.setEdition(scope.edition());
        ebook.setAuthor(scope.author());
        ebook.setLanguage(scope.language());
        ebook.setCoverImage(scope.coverImage());
    }

    private void ensureVisibleToUser(EBook ebook, CurrentUser user) {
        if (user == null) {
            throw new ForbiddenException();
        }
        if (user.isSuperAdmin()) {
            return;
        }
        if (user.isHeadOfficeScopedAdmin()) {
            if (!Objects.equals(user.headOfficeId(), ebook.getHeadOfficeId())) {
                throw new NotFoundException();
            }
            return;
        }
        if (user.isSchoolScopedAdminUser()) {
            if (!Objects.equals(user.schoolId(), ebook.getSchoolId())) {
                throw new NotFoundException();
            }
            return;
        }
        throw new ForbiddenException();
    }

    private EBookDto merge(EBook ebook, EBookDto dto) {
        EBookDto merged = new EBookDto();
        merged.setHeadOfficeId(ebook.getHeadOfficeId());
        merged.setSchoolId(ebook.getSchoolId());
        merged.setEbookType(ebook.getEbookType());
        merged.setClassId(ebook.getClassId());
        merged.setSubjectId(ebook.getSubjectId());
        merged.setEbookName(ebook.getEbookName());
        merged.setEdition(ebook.getEdition());
        merged.setAuthor(ebook.getAuthor());
        merged.setLanguage(ebook.getLanguage());
        merged.setCoverImage(ebook.getCoverImage());
        if (dto == null) {
            return merged;
        }
        if (dto.getHeadOfficeId() != null) merged.setHeadOfficeId(dto.getHeadOfficeId());
        if (dto.getSchoolId() != null) merged.setSchoolId(dto.getSchoolId());
        if (dto.getEbookType() != null) merged.setEbookType(dto.getEbookType());
        if (dto.getClassId() != null) merged.setClassId(dto.getClassId());
        if (dto.getSubjectId() != null) merged.setSubjectId(dto.getSubjectId());
        if (dto.getEbookName() != null) merged.setEbookName(dto.getEbookName());
        if (dto.getEdition() != null) merged.setEdition(dto.getEdition());
        if (dto.getAuthor() != null) merged.setAuthor(dto.getAuthor());
        if (dto.getLanguage() != null) merged.setLanguage(dto.getLanguage());
        if (dto.getCoverImage() != null) merged.setCoverImage(dto.getCoverImage());
        return merged;
    }

    private ManageSchool requireSchool(Long schoolId) {
        if (schoolId == null) {
            throw new BadRequestException("schoolId is required");
        }
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId).orElseThrow(NotFoundException::new);
    }

    private SchoolClass requireClass(Long classId) {
        if (classId == null) {
            throw new BadRequestException("classId is required");
        }
        return schoolClassRepository.findById(classId).orElseThrow(NotFoundException::new);
    }

    private Long normalizeId(Long value) {
        return value == null || value <= 0 ? null : value;
    }

    private String normalizeSearch(String search) {
        String value = search == null ? "" : search.trim();
        return value.isEmpty() ? null : value;
    }

    private String normalizeLanguage(String language) {
        String value = language == null ? "" : language.trim();
        return value.isEmpty() ? null : value;
    }

    private String normalizeType(String ebookType) {
        String value = ebookType == null ? "" : ebookType.trim();
        if (value.isEmpty()) {
            return null;
        }
        if (SUBJECT_TYPE.equalsIgnoreCase(value)) {
            return SUBJECT_TYPE;
        }
        if (GENERAL_TYPE.equalsIgnoreCase(value)) {
            return GENERAL_TYPE;
        }
        return null;
    }

    private String normalizeOptional(String value) {
        String trimmed = value == null ? "" : value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String requiredText(String value, String message) {
        String trimmed = normalizeOptional(value);
        if (trimmed == null) {
            throw new BadRequestException(message);
        }
        return trimmed;
    }

    private Long requiredId(Long value, String message) {
        if (value == null) {
            throw new BadRequestException(message);
        }
        return value;
    }

    private void validateSchoolScope(Long requestedHeadOfficeId, ManageSchool school) {
        if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
            throw new BadRequestException("School does not belong to the selected head office");
        }
    }

    private void saveFile(EBook ebook, MultipartFile ebookFile) {
        if (ebookFile == null || ebookFile.isEmpty()) {
            return;
        }

        try {
            Path baseDir = Paths.get(uploadProperties.getDir()).toAbsolutePath().normalize();
            Path ebooksDir = baseDir.resolve("ebooks");
            Files.createDirectories(ebooksDir);

            String originalName = normalizeOptional(ebookFile.getOriginalFilename());
            String safeName = sanitizeFileName(originalName == null ? "ebook-file" : originalName);
            String fileName = UUID.randomUUID() + "_" + safeName;
            Path targetPath = ebooksDir.resolve(fileName).normalize();

            ebookFile.transferTo(targetPath.toFile());

            ebook.setFileName(originalName);
            ebook.setFilePath("/uploads/ebooks/" + fileName);
        } catch (Exception e) {
            throw new RuntimeException("File upload failed");
        }
    }

    private String sanitizeFileName(String name) {
        String cleaned = name == null ? "ebook-file" : name.replaceAll("[^a-zA-Z0-9._-]", "_");
        return cleaned.isBlank() ? "ebook-file" : cleaned;
    }

    private EBookDto toDto(EBook ebook) {
        EBookDto dto = new EBookDto();
        dto.setId(ebook.getId());
        dto.setHeadOfficeId(ebook.getHeadOfficeId());
        dto.setHeadOfficeName(resolveHeadOfficeName(ebook.getHeadOfficeId()));
        dto.setSchoolId(ebook.getSchoolId());
        dto.setSchoolName(resolveSchoolName(ebook.getSchoolId()));
        dto.setEbookType(ebook.getEbookType());
        dto.setClassId(ebook.getClassId());
        dto.setClassName(resolveClassName(ebook.getClassId()));
        dto.setSubjectId(ebook.getSubjectId());
        dto.setSubjectName(resolveSubjectName(ebook.getSubjectId()));
        dto.setEbookName(ebook.getEbookName());
        dto.setEdition(ebook.getEdition());
        dto.setAuthor(ebook.getAuthor());
        dto.setLanguage(ebook.getLanguage());
        dto.setCoverImage(ebook.getCoverImage());
        dto.setFileName(ebook.getFileName());
        dto.setFilePath(ebook.getFilePath());
        dto.setCreatedAt(ebook.getCreatedAt());
        dto.setUpdatedAt(ebook.getUpdatedAt());
        return dto;
    }

    private String resolveSchoolName(Long schoolId) {
        if (schoolId == null) {
            return null;
        }
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .map(ManageSchool::getSchoolName)
                .orElse("School " + schoolId);
    }

    private String resolveHeadOfficeName(Long headOfficeId) {
        if (headOfficeId == null) {
            return null;
        }
        return headOfficeRepository.findById(headOfficeId)
                .map(HeadOffice::getName)
                .orElse("Head Office " + headOfficeId);
    }

    private String resolveClassName(Long classId) {
        if (classId == null) {
            return null;
        }
        return schoolClassRepository.findById(classId)
                .map(SchoolClass::getClassName)
                .orElse("Class " + classId);
    }

    private String resolveSubjectName(Long subjectId) {
        if (subjectId == null) {
            return null;
        }
        return subjectRepository.findById(subjectId)
                .map(Subject::getName)
                .orElse("Subject " + subjectId);
    }

    private record ResolvedScope(Long headOfficeId, Long schoolId, Long classId) {
    }

    private record ResolvedWriteScope(Long headOfficeId, Long schoolId, String ebookType, Long classId, Long subjectId, String ebookName, String edition, String author, String language, String coverImage) {
    }
}
