package com.School.School_management.Service;

import com.School.School_management.Dto.AttendanceDto;
import org.springframework.data.domain.Page;
import java.time.LocalDate;
import java.util.List;

public interface AttendanceService {
    List<AttendanceDto> list(Long headOfficeId, Long schoolId, String examTerm, String className, String sectionName, String subjectName, LocalDate attendanceDate, String search);
    Page<AttendanceDto> listPaginated(Long headOfficeId, Long schoolId, String examTerm, String className, String sectionName, String subjectName, LocalDate attendanceDate, String search, int page, int size);
    AttendanceDto getById(Long id);
    AttendanceDto create(AttendanceDto dto);
    AttendanceDto update(Long id, AttendanceDto dto);
    void delete(Long id);
}
