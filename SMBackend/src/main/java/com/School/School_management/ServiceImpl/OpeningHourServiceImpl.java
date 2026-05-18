package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.OpeningHourDto;
import com.School.School_management.Entity.OpeningHour;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.OpeningHourRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.OpeningHourService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@Transactional
public class OpeningHourServiceImpl implements OpeningHourService {

    private final OpeningHourRepository openingHourRepository;
    private final SchoolRepository schoolRepository;

    public OpeningHourServiceImpl(
            OpeningHourRepository openingHourRepository,
            SchoolRepository schoolRepository
    ) {
        this.openingHourRepository = openingHourRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OpeningHourDto> getOpeningHours(Long schoolId, int page, int size) {
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
            effectiveSchoolId = schoolId;
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return openingHourRepository.searchOpeningHours(effectiveSchoolId, pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public OpeningHourDto getOpeningHourById(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        OpeningHour existing = openingHourRepository.findById(id).orElseThrow(NotFoundException::new);

        if (user.isSchoolScoped()) {
            if (!Objects.equals(existing.getSchoolId(), user.schoolId())) {
                throw new ForbiddenException();
            }
        } else if (user.isHeadOfficeScopedAdmin()) {
            ensureSchoolInHeadOffice(existing.getSchoolId(), user.headOfficeId());
        }

        return toDto(existing);
    }

    @Override
    public OpeningHourDto createOpeningHour(OpeningHourDto dto) {
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

        OpeningHour oh = new OpeningHour();
        oh.setSchoolId(effectiveSchoolId);
        oh.setStatus(dto.getStatus());
        
        mapDayValues(dto, oh);

        return toDto(openingHourRepository.save(oh));
    }

    @Override
    public OpeningHourDto updateOpeningHour(Long id, OpeningHourDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        OpeningHour existing = openingHourRepository.findById(id).orElseThrow(NotFoundException::new);

        if (user.isSchoolScoped()) {
            if (!Objects.equals(existing.getSchoolId(), user.schoolId())) {
                throw new ForbiddenException();
            }
        } else if (user.isHeadOfficeScopedAdmin()) {
            ensureSchoolInHeadOffice(existing.getSchoolId(), user.headOfficeId());
        }

        existing.setStatus(dto.getStatus());
        mapDayValues(dto, existing);

        return toDto(openingHourRepository.save(existing));
    }

    @Override
    public OpeningHourDto toggleStatus(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        OpeningHour existing = openingHourRepository.findById(id).orElseThrow(NotFoundException::new);

        if (user.isSchoolScoped()) {
            if (!Objects.equals(existing.getSchoolId(), user.schoolId())) {
                throw new ForbiddenException();
            }
        } else if (user.isHeadOfficeScopedAdmin()) {
            ensureSchoolInHeadOffice(existing.getSchoolId(), user.headOfficeId());
        }

        existing.setStatus(!existing.getStatus());
        return toDto(openingHourRepository.save(existing));
    }

    @Override
    public void deleteOpeningHour(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        OpeningHour existing = openingHourRepository.findById(id).orElseThrow(NotFoundException::new);

        if (user.isSchoolScoped()) {
            if (!Objects.equals(existing.getSchoolId(), user.schoolId())) {
                throw new ForbiddenException();
            }
        } else if (user.isHeadOfficeScopedAdmin()) {
            ensureSchoolInHeadOffice(existing.getSchoolId(), user.headOfficeId());
        }

        openingHourRepository.delete(existing);
    }

    private void ensureSchoolInHeadOffice(Long schoolId, Long headOfficeId) {
        boolean ok = schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isPresent();
        if (!ok) throw new NotFoundException();
    }

    private void mapDayValues(OpeningHourDto dto, OpeningHour oh) {
        // Monday
        oh.setMondayEnabled(dto.getMondayEnabled());
        oh.setMondayStart(dto.getMondayStart());
        oh.setMondayEnd(dto.getMondayEnd());

        // Tuesday
        oh.setTuesdayEnabled(dto.getTuesdayEnabled());
        oh.setTuesdayStart(dto.getTuesdayStart());
        oh.setTuesdayEnd(dto.getTuesdayEnd());

        // Wednesday
        oh.setWednesdayEnabled(dto.getWednesdayEnabled());
        oh.setWednesdayStart(dto.getWednesdayStart());
        oh.setWednesdayEnd(dto.getWednesdayEnd());

        // Thursday
        oh.setThursdayEnabled(dto.getThursdayEnabled());
        oh.setThursdayStart(dto.getThursdayStart());
        oh.setThursdayEnd(dto.getThursdayEnd());

        // Friday
        oh.setFridayEnabled(dto.getFridayEnabled());
        oh.setFridayStart(dto.getFridayStart());
        oh.setFridayEnd(dto.getFridayEnd());

        // Saturday
        oh.setSaturdayEnabled(dto.getSaturdayEnabled());
        oh.setSaturdayStart(dto.getSaturdayStart());
        oh.setSaturdayEnd(dto.getSaturdayEnd());

        // Sunday
        oh.setSundayEnabled(dto.getSundayEnabled());
        oh.setSundayStart(dto.getSundayStart());
        oh.setSundayEnd(dto.getSundayEnd());
    }

    private OpeningHourDto toDto(OpeningHour oh) {
        OpeningHourDto dto = new OpeningHourDto();
        dto.setId(oh.getId());
        dto.setSchoolId(oh.getSchoolId());
        dto.setStatus(oh.getStatus());

        // Monday
        dto.setMondayEnabled(oh.getMondayEnabled());
        dto.setMondayStart(oh.getMondayStart());
        dto.setMondayEnd(oh.getMondayEnd());

        // Tuesday
        dto.setTuesdayEnabled(oh.getTuesdayEnabled());
        dto.setTuesdayStart(oh.getTuesdayStart());
        dto.setTuesdayEnd(oh.getTuesdayEnd());

        // Wednesday
        dto.setWednesdayEnabled(oh.getWednesdayEnabled());
        dto.setWednesdayStart(oh.getWednesdayStart());
        dto.setWednesdayEnd(oh.getWednesdayEnd());

        // Thursday
        dto.setThursdayEnabled(oh.getThursdayEnabled());
        dto.setThursdayStart(oh.getThursdayStart());
        dto.setThursdayEnd(oh.getThursdayEnd());

        // Friday
        dto.setFridayEnabled(oh.getFridayEnabled());
        dto.setFridayStart(oh.getFridayStart());
        dto.setFridayEnd(oh.getFridayEnd());

        // Saturday
        dto.setSaturdayEnabled(oh.getSaturdayEnabled());
        dto.setSaturdayStart(oh.getSaturdayStart());
        dto.setSaturdayEnd(oh.getSaturdayEnd());

        // Sunday
        dto.setSundayEnabled(oh.getSundayEnabled());
        dto.setSundayStart(oh.getSundayStart());
        dto.setSundayEnd(oh.getSundayEnd());

        String schoolName = schoolRepository.findById(oh.getSchoolId())
                .map(ManageSchool::getSchoolName)
                .orElse("School " + oh.getSchoolId());
        dto.setSchoolName(schoolName);

        return dto;
    }
}
