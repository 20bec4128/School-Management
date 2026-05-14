package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.NewsDto;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.News;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.NewsRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.NewsService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NewsServiceImpl implements NewsService {

    private final NewsRepository newsRepository;
    private final SchoolRepository schoolRepository;

    public NewsServiceImpl(NewsRepository newsRepository, SchoolRepository schoolRepository) {
        this.newsRepository = newsRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<NewsDto.Response> list(Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        List<News> rows;
        if (user.isSuperAdmin() && schoolId == null) {
            rows = newsRepository.findAllByIsDeletedFalseOrderByIdDesc();
        } else {
            Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
            rows = newsRepository.findBySchoolIdAndIsDeletedFalseOrderByIdDesc(effectiveSchoolId);
        }
        return rows.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public NewsDto.Response create(NewsDto.Request request) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, request == null ? null : request.getSchoolId());
        News entity = new News();
        entity.setSchoolId(effectiveSchoolId);
        entity.setTitle(normalizeRequired(request == null ? null : request.getTitle(), "Title is required"));
        entity.setNewsDate(requireDate(request == null ? null : request.getDate()));
        entity.setImage(normalizeOptional(request == null ? null : request.getImage()));
        entity.setNews(normalizeOptional(request == null ? null : request.getNews()));
        entity.setIsViewOnWeb(Boolean.TRUE.equals(request == null ? null : request.getIsViewOnWeb()));
        entity.setIsDeleted(false);
        return toResponse(newsRepository.save(entity));
    }

    @Override
    public NewsDto.Response update(Long id, NewsDto.Request request) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        News entity = newsRepository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, request == null ? null : request.getSchoolId());
        if (!Objects.equals(entity.getSchoolId(), effectiveSchoolId) && !user.isSuperAdmin()) {
            throw new ForbiddenException();
        }

        entity.setSchoolId(effectiveSchoolId);
        entity.setTitle(normalizeRequired(request == null ? null : request.getTitle(), "Title is required"));
        entity.setNewsDate(requireDate(request == null ? null : request.getDate()));
        entity.setImage(normalizeOptional(request == null ? null : request.getImage()));
        entity.setNews(normalizeOptional(request == null ? null : request.getNews()));
        entity.setIsViewOnWeb(Boolean.TRUE.equals(request == null ? null : request.getIsViewOnWeb()));
        return toResponse(newsRepository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        News entity = newsRepository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, entity.getSchoolId());
        if (!Objects.equals(entity.getSchoolId(), effectiveSchoolId) && !user.isSuperAdmin()) {
            throw new ForbiddenException();
        }
        entity.setIsDeleted(true);
        newsRepository.save(entity);
    }

    private Long effectiveSchoolIdForRead(CurrentUser user, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return user.schoolId();
        }
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
        boolean ok = schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isPresent();
        if (!ok) throw new NotFoundException();
    }

    private NewsDto.Response toResponse(News entity) {
        NewsDto.Response dto = new NewsDto.Response();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setSchoolName(resolveSchoolName(entity.getSchoolId()));
        dto.setTitle(entity.getTitle());
        dto.setDate(entity.getNewsDate());
        dto.setImage(entity.getImage());
        dto.setNews(entity.getNews());
        dto.setIsViewOnWeb(entity.getIsViewOnWeb());
        return dto;
    }

    private String resolveSchoolName(Long schoolId) {
        if (schoolId == null) return null;
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .map(ManageSchool::getSchoolName)
                .orElse(null);
    }

    private String normalizeRequired(String value, String message) {
        if (value == null) throw new BadRequestException(message);
        String trimmed = value.trim();
        if (trimmed.isEmpty()) throw new BadRequestException(message);
        return trimmed;
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private java.time.LocalDate requireDate(java.time.LocalDate value) {
        if (value == null) throw new BadRequestException("Date is required");
        return value;
    }
}
