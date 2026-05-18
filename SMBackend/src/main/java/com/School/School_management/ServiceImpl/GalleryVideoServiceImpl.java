package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.GalleryVideoDto;
import com.School.School_management.Entity.Gallery;
import com.School.School_management.Entity.GalleryVideo;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.GalleryVideoRepository;
import com.School.School_management.Repository.GalleryRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.GalleryVideoService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
public class GalleryVideoServiceImpl implements GalleryVideoService {

    private final GalleryVideoRepository galleryVideoRepository;
    private final GalleryRepository galleryRepository;
    private final SchoolRepository schoolRepository;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public GalleryVideoServiceImpl(
            GalleryVideoRepository galleryVideoRepository,
            GalleryRepository galleryRepository,
            SchoolRepository schoolRepository
    ) {
        this.galleryVideoRepository = galleryVideoRepository;
        this.galleryRepository = galleryRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<GalleryVideoDto.Response> list(Long schoolId, Long galleryId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        List<GalleryVideo> rows;
        if (user.isSuperAdmin() && schoolId == null) {
            rows = galleryVideoRepository.findAllByIsDeletedFalseOrderByIdDesc();
        } else {
            Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
            rows = galleryVideoRepository.findBySchoolIdAndIsDeletedFalseOrderByIdDesc(effectiveSchoolId);
        }

        if (galleryId != null) {
            rows = rows.stream().filter(r -> Objects.equals(r.getGalleryId(), galleryId)).collect(Collectors.toList());
        }

        return rows.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<GalleryVideoDto.Response> page(Long schoolId, Long galleryId, String search, int page, int size) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        final String q = normalizeOptional(search);
        List<GalleryVideoDto.Response> filtered = galleryVideoRepository.findBySchoolIdAndIsDeletedFalseOrderByIdDesc(effectiveSchoolId).stream()
                .map(this::toResponse)
                .filter(dto -> matches(dto, galleryId, q))
                .sorted(Comparator.comparing(GalleryVideoDto.Response::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
        int start = Math.min(pageable.getPageNumber() * pageable.getPageSize(), filtered.size());
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        return new PageImpl<>(filtered.subList(start, end), pageable, filtered.size());
    }

    @Override
    public GalleryVideoDto.Response create(GalleryVideoDto.Request request, MultipartFile file) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, request == null ? null : request.getSchoolId());
        GalleryVideo entity = new GalleryVideo();
        entity.setSchoolId(effectiveSchoolId);
        entity.setGalleryId(normalizeRequired(request == null ? null : request.getGalleryId(), "Gallery ID is required"));
        entity.setTitle(normalizeRequired(request == null ? null : request.getTitle(), "Title is required"));
        entity.setCaption(normalizeOptional(request == null ? null : request.getCaption()));
        entity.setIsDeleted(false);

        if (file != null && !file.isEmpty()) {
            entity.setVideoPath(saveFile(file, "gallery_videos"));
        } else {
            entity.setVideoPath(normalizeOptional(request == null ? null : request.getVideoPath()));
        }

        return toResponse(galleryVideoRepository.save(entity));
    }

    @Override
    public GalleryVideoDto.Response update(Long id, GalleryVideoDto.Request request, MultipartFile file) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        GalleryVideo entity = galleryVideoRepository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, request == null ? null : request.getSchoolId());
        if (!Objects.equals(entity.getSchoolId(), effectiveSchoolId) && !user.isSuperAdmin()) {
            throw new ForbiddenException();
        }

        entity.setSchoolId(effectiveSchoolId);
        entity.setGalleryId(normalizeRequired(request == null ? null : request.getGalleryId(), "Gallery ID is required"));
        entity.setTitle(normalizeRequired(request == null ? null : request.getTitle(), "Title is required"));
        entity.setCaption(normalizeOptional(request == null ? null : request.getCaption()));

        if (file != null && !file.isEmpty()) {
            entity.setVideoPath(saveFile(file, "gallery_videos"));
        } else {
            entity.setVideoPath(normalizeOptional(request == null ? null : request.getVideoPath()));
        }

        return toResponse(galleryVideoRepository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        GalleryVideo entity = galleryVideoRepository.findById(id).orElseThrow(NotFoundException::new);
        entity.setIsDeleted(true);
        galleryVideoRepository.save(entity);
    }

    private String saveFile(MultipartFile file, String subDir) {
        try {
            Path folderPath = Paths.get(uploadDir, subDir);
            Files.createDirectories(folderPath);

            String originalName = file.getOriginalFilename();
            String storedName = UUID.randomUUID() + "_" + originalName;

            Path filePath = folderPath.resolve(storedName);
            Files.copy(file.getInputStream(), filePath);

            return storedName;
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload file");
        }
    }

    private Long effectiveSchoolIdForRead(CurrentUser user, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            return user.schoolId();
        }
        if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
        return requestedSchoolId;
    }

    private Long effectiveSchoolIdForWrite(CurrentUser user, Long requestedSchoolId) {
        return effectiveSchoolIdForRead(user, requestedSchoolId);
    }

    private GalleryVideoDto.Response toResponse(GalleryVideo entity) {
        GalleryVideoDto.Response dto = new GalleryVideoDto.Response();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchoolId());

        ManageSchool school = resolveSchool(entity.getSchoolId());
        if (school != null) {
            dto.setSchoolName(school.getSchoolName());
            dto.setHeadOfficeId(school.getHeadOfficeId());
        }

        dto.setGalleryId(entity.getGalleryId());
        dto.setGalleryTitle(resolveGalleryTitle(entity.getGalleryId()));
        dto.setTitle(entity.getTitle());
        dto.setVideoPath(entity.getVideoPath());
        dto.setCaption(entity.getCaption());
        return dto;
    }

    private ManageSchool resolveSchool(Long schoolId) {
        if (schoolId == null) return null;
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId).orElse(null);
    }

    private String resolveGalleryTitle(Long galleryId) {
        if (galleryId == null) return null;
        return galleryRepository.findById(galleryId)
                .map(Gallery::getTitle)
                .orElse(null);
    }

    private <T> T normalizeRequired(T value, String message) {
        if (value == null) throw new BadRequestException(message);
        if (value instanceof String && ((String) value).trim().isEmpty()) throw new BadRequestException(message);
        return value;
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean matches(GalleryVideoDto.Response dto, Long galleryId, String search) {
        if (galleryId != null && !Objects.equals(dto.getGalleryId(), galleryId)) {
            return false;
        }
        if (search == null) {
            return true;
        }
        String q = search.toLowerCase(Locale.ROOT);
        return containsIgnoreCase(dto.getTitle(), q)
                || containsIgnoreCase(dto.getCaption(), q)
                || containsIgnoreCase(dto.getVideoPath(), q)
                || containsIgnoreCase(dto.getGalleryTitle(), q);
    }

    private boolean containsIgnoreCase(String value, String query) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(query);
    }
}
