package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.AttendanceDto;
import com.School.School_management.Entity.Attendance;
import com.School.School_management.Repository.AttendanceRepository;
import com.School.School_management.Service.AttendanceService;
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
public class AttendanceServiceImpl implements AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Override
    public List<AttendanceDto> list(Long headOfficeId, Long schoolId, String examTerm, String className, String sectionName, String subjectName, String search) {
        String cleanSearch = (search != null) ? search.trim() : "";
        return attendanceRepository.findAllWithFilters(headOfficeId, schoolId, examTerm, className, sectionName, subjectName, cleanSearch)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<AttendanceDto> listPaginated(Long headOfficeId, Long schoolId, String examTerm, String className, String sectionName, String subjectName, String search, int page, int size) {
        String cleanSearch = (search != null) ? search.trim() : "";
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return attendanceRepository.findAllWithFiltersPaginated(headOfficeId, schoolId, examTerm, className, sectionName, subjectName, cleanSearch, pageable)
                .map(this::convertToDto);
    }

    @Override
    public AttendanceDto getById(Long id) {
        Attendance entity = attendanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attendance record not found for id: " + id));
        return convertToDto(entity);
    }

    @Override
    @Transactional
    public AttendanceDto create(AttendanceDto dto) {
        Attendance entity = convertToEntity(dto);
        Attendance saved = attendanceRepository.save(entity);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public AttendanceDto update(Long id, AttendanceDto dto) {
        Attendance existing = attendanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attendance record not found for id: " + id));

        existing.setHeadOfficeId(dto.getHeadOfficeId());
        existing.setSchoolId(dto.getSchoolId());
        existing.setExamTerm(dto.getExamTerm());
        existing.setClassName(dto.getClassName());
        existing.setSectionName(dto.getSectionName());
        existing.setSubjectName(dto.getSubjectName());
        existing.setName(dto.getName());
        existing.setPhone(dto.getPhone());
        existing.setRollNo(dto.getRollNo());
        existing.setPhotoPath(dto.getPhotoPath());
        existing.setAttendAll(dto.getAttendAll());
        if (dto.getAttendanceDate() != null) {
            existing.setAttendanceDate(dto.getAttendanceDate());
        }
        existing.setNote(dto.getNote());

        Attendance updated = attendanceRepository.save(existing);
        return convertToDto(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!attendanceRepository.existsById(id)) {
            throw new RuntimeException("Attendance record not found for id: " + id);
        }
        attendanceRepository.deleteById(id);
    }

    private AttendanceDto convertToDto(Attendance entity) {
        return AttendanceDto.builder()
                .id(entity.getId())
                .headOfficeId(entity.getHeadOfficeId())
                .schoolId(entity.getSchoolId())
                .examTerm(entity.getExamTerm())
                .className(entity.getClassName())
                .sectionName(entity.getSectionName())
                .subjectName(entity.getSubjectName())
                .name(entity.getName())
                .phone(entity.getPhone())
                .rollNo(entity.getRollNo())
                .photoPath(entity.getPhotoPath())
                .attendAll(entity.getAttendAll())
                .attendanceDate(entity.getAttendanceDate())
                .note(entity.getNote())
                .build();
    }

    private Attendance convertToEntity(AttendanceDto dto) {
        return Attendance.builder()
                .headOfficeId(dto.getHeadOfficeId())
                .schoolId(dto.getSchoolId())
                .examTerm(dto.getExamTerm())
                .className(dto.getClassName())
                .sectionName(dto.getSectionName())
                .subjectName(dto.getSubjectName())
                .name(dto.getName())
                .phone(dto.getPhone())
                .rollNo(dto.getRollNo())
                .photoPath(dto.getPhotoPath())
                .attendAll(dto.getAttendAll())
                .attendanceDate(dto.getAttendanceDate())
                .note(dto.getNote())
                .build();
    }
}
