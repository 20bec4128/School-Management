package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.AttendanceDto;
import com.School.School_management.Entity.Attendance;
import com.School.School_management.Entity.EmailMessage;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.Student;
import com.School.School_management.Repository.AbsentEmailSettingRepository;
import com.School.School_management.Repository.AttendanceRepository;
import com.School.School_management.Repository.EmailMessageRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.StudentRepository;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AttendanceServiceImpl implements AttendanceService {

    private static final Logger log = LoggerFactory.getLogger(AttendanceServiceImpl.class);

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private AbsentEmailSettingRepository absentEmailSettingRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private SchoolRepository schoolRepository;

    @Autowired
    private EmailMessageRepository emailMessageRepository;

    @Autowired
    private EmailMessageDispatchService emailMessageDispatchService;

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
        // Duplicate protection: if an identical attendance record already exists, return it and do not resend emails.
        if (dto.getSchoolId() != null
                && dto.getExamTerm() != null
                && dto.getClassName() != null
                && dto.getSubjectName() != null
                && dto.getRollNo() != null
                && dto.getAttendanceDate() != null) {
            var existing = attendanceRepository.findExistingAttendance(
                    dto.getSchoolId(),
                    dto.getExamTerm(),
                    dto.getClassName(),
                    (dto.getSectionName() == null || dto.getSectionName().trim().isEmpty()) ? null : dto.getSectionName(),
                    dto.getSubjectName(),
                    dto.getRollNo(),
                    dto.getAttendanceDate()
            );
            if (existing.isPresent()) {
                return convertToDto(existing.get());
            }
        }

        Attendance entity = convertToEntity(dto);
        Attendance saved = attendanceRepository.save(entity);

        // Auto-send absent email for student daily attendance only.
        try {
            maybeSendAbsentStudentEmail(dto);
        } catch (Exception ex) {
            // Never fail attendance save because email sending failed.
            log.warn("Absent email auto-send failed for schoolId={}, rollNo={}, date={}: {}",
                    dto.getSchoolId(), dto.getRollNo(), dto.getAttendanceDate(), ex.getMessage(), ex);
        }

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

    private void maybeSendAbsentStudentEmail(AttendanceDto dto) {
        if (dto.getSchoolId() == null) return;
        if (dto.getAttendanceDate() == null) return;
        if (dto.getExamTerm() == null || !dto.getExamTerm().trim().equalsIgnoreCase("Daily Attendance")) return;
        if (dto.getAttendAll() == null || !dto.getAttendAll().trim().equalsIgnoreCase("Absent")) return;

        var settingOpt = absentEmailSettingRepository.findBySchoolId(dto.getSchoolId());
        var setting = settingOpt.orElseGet(() -> {
            // Create a default enabled setting on first use so schools get auto-send behavior without extra setup.
            var created = new com.School.School_management.Entity.AbsentEmailSetting();
            created.setHeadOfficeId(dto.getHeadOfficeId());
            created.setSchoolId(dto.getSchoolId());
            created.setEnabled(Boolean.TRUE);
            created.setReceiverType("Student");
            created.setSubjectTemplate("Absent Notification for {student_name}");
            created.setEmailBodyTemplate("Dear {receiver_name},\n\nThis is to inform you that {student_name} was absent on {absent_date} in {class_name} - {section_name}.\n\nRegards,\n{school_name}");
            return absentEmailSettingRepository.save(created);
        });
        if (setting.getEnabled() == null || !setting.getEnabled()) return;

        String rollNo = dto.getRollNo() != null ? dto.getRollNo().trim() : "";
        if (rollNo.isEmpty()) return;

        Student student = studentRepository.findBySchool_IdAndRollNoAndDeletedFalse(dto.getSchoolId(), rollNo).orElse(null);
        if (student == null) return;
        String email = student.getEmail() != null ? student.getEmail().trim() : "";
        if (email.isEmpty()) return;

        ManageSchool school = schoolRepository.findByIdAndIsDeletedFalse(dto.getSchoolId()).orElse(null);
        String schoolName = school != null ? safe(school.getSchoolName()) : "";

        String studentName = safe(student.getName());
        String className = safe(dto.getClassName());
        String sectionName = safe(dto.getSectionName());
        String absentDate = dto.getAttendanceDate().toString();

        String subject = render(setting.getSubjectTemplate(), schoolName, studentName, className, sectionName, absentDate);
        String body = render(setting.getEmailBodyTemplate(), schoolName, studentName, className, sectionName, absentDate);

        EmailMessage msg = EmailMessage.builder()
                .headOfficeId(dto.getHeadOfficeId())
                .schoolId(dto.getSchoolId())
                .schoolName(schoolName)
                .className(className)
                .receiverType("Student")
                .receiver(email)
                .subject(subject)
                .emailBody(body)
                .sendDate(dto.getAttendanceDate())
                .category("ABSENT_ATTENDANCE")
                .build();

        EmailMessage saved = emailMessageRepository.save(msg);
        emailMessageDispatchService.sendAsync(saved);
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private String render(String template, String schoolName, String studentName, String className, String sectionName, String absentDate) {
        String t = template == null ? "" : template;
        return t
                .replace("{school_name}", schoolName)
                .replace("{receiver_name}", studentName)
                .replace("{student_name}", studentName)
                .replace("{class_name}", className)
                .replace("{section_name}", sectionName)
                .replace("{absent_date}", absentDate);
    }
}
