package com.School.School_management.Service.ServiceImpl;

import com.School.School_management.Dto.ScheduleDto;
import com.School.School_management.Entity.Schedule;
import com.School.School_management.Repository.ScheduleRepository;
import com.School.School_management.Service.ScheduleService;
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
public class ScheduleServiceImpl implements ScheduleService {

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Override
    public List<ScheduleDto> list(Long schoolId) {
        return scheduleRepository.findBySchoolId(schoolId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<ScheduleDto> listPaginated(Long schoolId, int page, int size, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("examDate").ascending().and(Sort.by("startTime").ascending()));
        Page<Schedule> schedulePage;
        
        if (search != null && !search.trim().isEmpty()) {
            schedulePage = scheduleRepository.findBySchoolIdWithSearch(schoolId, search.trim(), pageable);
        } else {
            schedulePage = scheduleRepository.findBySchoolId(schoolId, pageable);
        }
        
        return schedulePage.map(this::convertToDto);
    }

    @Override
    @Transactional
    public ScheduleDto create(ScheduleDto dto) {
        Schedule schedule = convertToEntity(dto);
        Schedule saved = scheduleRepository.save(schedule);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public ScheduleDto update(Long id, ScheduleDto dto) {
        Schedule existing = scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule record not found for id: " + id));
        
        existing.setExamTerm(dto.getExamTerm());
        existing.setClassName(dto.getClassName());
        existing.setSubjectName(dto.getSubjectName());
        existing.setExamDate(dto.getExamDate());
        existing.setStartTime(dto.getStartTime());
        existing.setEndTime(dto.getEndTime());
        existing.setRoomNo(dto.getRoomNo());
        existing.setNote(dto.getNote());
        
        Schedule updated = scheduleRepository.save(existing);
        return convertToDto(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!scheduleRepository.existsById(id)) {
            throw new RuntimeException("Schedule record not found for id: " + id);
        }
        scheduleRepository.deleteById(id);
    }

    @Override
    public ScheduleDto findById(Long id) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule record not found for id: " + id));
        return convertToDto(schedule);
    }

    private ScheduleDto convertToDto(Schedule entity) {
        return ScheduleDto.builder()
                .id(entity.getId())
                .schoolId(entity.getSchoolId())
                .examTerm(entity.getExamTerm())
                .className(entity.getClassName())
                .subjectName(entity.getSubjectName())
                .examDate(entity.getExamDate())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .roomNo(entity.getRoomNo())
                .note(entity.getNote())
                .build();
    }

    private Schedule convertToEntity(ScheduleDto dto) {
        return Schedule.builder()
                .schoolId(dto.getSchoolId())
                .examTerm(dto.getExamTerm())
                .className(dto.getClassName())
                .subjectName(dto.getSubjectName())
                .examDate(dto.getExamDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .roomNo(dto.getRoomNo())
                .note(dto.getNote())
                .build();
    }
}
