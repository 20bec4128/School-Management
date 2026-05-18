package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.FeedbackDto;
import com.School.School_management.Entity.Feedback;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.FeedbackRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.FeedbackService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Objects;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final SchoolRepository schoolRepository;

    public FeedbackServiceImpl(
            FeedbackRepository feedbackRepository,
            SchoolRepository schoolRepository
    ) {
        this.feedbackRepository = feedbackRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FeedbackDto> getFeedbacks(Long schoolId, String search, int page, int size) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Long effectiveSchoolId = null;
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            effectiveSchoolId = user.schoolId();
        } else if (user.isHeadOfficeScopedAdmin()) {
            if (schoolId == null) throw new BadRequestException("schoolId is required");
            ensureSchoolInHeadOffice(schoolId, user.headOfficeId());
            effectiveSchoolId = schoolId;
        } else {
            // Super Admin or global scope
            effectiveSchoolId = schoolId;
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedSearch = (search == null || search.trim().isEmpty()) ? null : search.trim();

        return feedbackRepository.findAll(buildSpec(effectiveSchoolId, normalizedSearch), pageable)
                .map(this::toDto);
    }

    @Override
    public FeedbackDto createFeedback(FeedbackDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Long effectiveSchoolId = null;
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            effectiveSchoolId = user.schoolId();
        } else if (user.isHeadOfficeScopedAdmin()) {
            if (dto.getSchoolId() == null) throw new BadRequestException("schoolId is required");
            ensureSchoolInHeadOffice(dto.getSchoolId(), user.headOfficeId());
            effectiveSchoolId = dto.getSchoolId();
        } else {
            if (dto.getSchoolId() == null) throw new BadRequestException("schoolId is required");
            effectiveSchoolId = dto.getSchoolId();
        }

        Feedback f = new Feedback();
        f.setSchoolId(effectiveSchoolId);
        f.setFeedback(required(dto.getFeedback(), "Feedback text is required"));
        f.setIsPublish(dto.getIsPublish());
        f.setDate(dto.getDate() != null ? dto.getDate() : LocalDate.now());

        return toDto(feedbackRepository.save(f));
    }

    @Override
    public FeedbackDto togglePublish(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Feedback existing = feedbackRepository.findById(id).orElseThrow(NotFoundException::new);

        if (user.isSchoolScoped()) {
            if (!Objects.equals(existing.getSchoolId(), user.schoolId())) {
                throw new ForbiddenException();
            }
        } else if (user.isHeadOfficeScopedAdmin()) {
            ensureSchoolInHeadOffice(existing.getSchoolId(), user.headOfficeId());
        }

        existing.setIsPublish(!existing.getIsPublish());
        return toDto(feedbackRepository.save(existing));
    }

    @Override
    public void deleteFeedback(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Feedback existing = feedbackRepository.findById(id).orElseThrow(NotFoundException::new);

        if (user.isSchoolScoped()) {
            if (!Objects.equals(existing.getSchoolId(), user.schoolId())) {
                throw new ForbiddenException();
            }
        } else if (user.isHeadOfficeScopedAdmin()) {
            ensureSchoolInHeadOffice(existing.getSchoolId(), user.headOfficeId());
        }

        feedbackRepository.delete(existing);
    }

    private void ensureSchoolInHeadOffice(Long schoolId, Long headOfficeId) {
        boolean ok = schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isPresent();
        if (!ok) throw new NotFoundException();
    }

    private Specification<Feedback> buildSpec(Long schoolId, String search) {
        return (root, query, cb) -> {
            java.util.List<Predicate> predicates = new ArrayList<>();

            if (schoolId != null) {
                predicates.add(cb.equal(root.get("schoolId"), schoolId));
            }

            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("feedback")), like));
            }

            return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private FeedbackDto toDto(Feedback f) {
        FeedbackDto dto = new FeedbackDto();
        dto.setId(f.getId());
        dto.setSchoolId(f.getSchoolId());
        dto.setFeedback(f.getFeedback());
        dto.setIsPublish(f.getIsPublish());
        dto.setDate(f.getDate());

        String schoolName = f.getSchoolId() == null
                ? "School"
                : schoolRepository.findByIdAndIsDeletedFalse(f.getSchoolId())
                        .map(ManageSchool::getSchoolName)
                        .orElse("School " + f.getSchoolId());
        dto.setSchoolName(schoolName);

        return dto;
    }

    private String trim(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }

    private String required(String v, String msg) {
        String t = trim(v);
        if (t == null) throw new BadRequestException(msg);
        return t;
    }
}
