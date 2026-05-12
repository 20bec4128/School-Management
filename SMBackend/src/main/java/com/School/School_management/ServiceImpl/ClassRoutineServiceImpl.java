package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.ClassRoutineDto;
import com.School.School_management.Entity.ClassRoutine;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.ClassRoutineRepository;
import com.School.School_management.Repository.SchoolClassRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.SchoolSectionRepository;
import com.School.School_management.Repository.SubjectRepository;
import com.School.School_management.Entity.ManageTeacher;
import com.School.School_management.Repository.TeacherRepository;
import com.School.School_management.Service.ClassRoutineService;
import java.time.DateTimeException;
import java.time.LocalTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ClassRoutineServiceImpl implements ClassRoutineService {

    private final ClassRoutineRepository repository;
    private final SchoolRepository schoolRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SchoolSectionRepository schoolSectionRepository;
    private final SubjectRepository subjectRepository;
    private final TeacherRepository teacherRepository;

    public ClassRoutineServiceImpl(
            ClassRoutineRepository repository,
            SchoolRepository schoolRepository,
            SchoolClassRepository schoolClassRepository,
            SchoolSectionRepository schoolSectionRepository,
            SubjectRepository subjectRepository,
            TeacherRepository teacherRepository) {
        this.repository = repository;
        this.schoolRepository = schoolRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.schoolSectionRepository = schoolSectionRepository;
        this.subjectRepository = subjectRepository;
        this.teacherRepository = teacherRepository;
    }

    @Override
    public ClassRoutineDto create(ClassRoutineDto dto) {
        requireRoutineFields(dto);
        ensureNoDuplicate(dto, null);
        ClassRoutine routine = new ClassRoutine();
        apply(dto, routine);
        return toDto(repository.save(routine));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassRoutineDto> getAll(Long schoolId) {
        List<ClassRoutine> rows = schoolId == null
                ? repository.findAllByOrderByIdDesc()
                : repository.findBySchoolIdOrderByIdDesc(schoolId);
        return rows
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ClassRoutineDto getById(Long id, Long schoolId) {
        return toDto(findRoutine(id, schoolId));
    }

    @Override
    public ClassRoutineDto update(Long id, ClassRoutineDto dto, Long schoolId) {
        ClassRoutine routine = findRoutine(id, schoolId);
        requireRoutineFields(dto);
        ensureNoDuplicate(dto, id);
        apply(dto, routine);

        return toDto(repository.save(routine));
    }

    @Override
    public void delete(Long id, Long schoolId) {
        repository.delete(findRoutine(id, schoolId));
    }

    private ClassRoutine findRoutine(Long id, Long schoolId) {
        if (schoolId != null) {
            return repository.findByIdAndSchoolId(id, schoolId)
                    .orElseThrow(() -> new NotFoundException("Class routine not found"));
        }
        return repository.findById(id).orElseThrow(() -> new NotFoundException("Class routine not found"));
    }

    private void apply(ClassRoutineDto dto, ClassRoutine routine) {
        routine.setSchoolId(dto.getSchoolId());
        routine.setClassId(dto.getClassId());
        routine.setSectionId(dto.getSectionId());
        routine.setSubjectId(dto.getSubjectId());
        routine.setTeacherId(dto.getTeacherId());
        routine.setDay(dto.getDay());
        routine.setStartTime(parseTime(dto.getStartTime(), "Start time"));
        routine.setEndTime(parseTime(dto.getEndTime(), "End time"));
        routine.setRoomNo(dto.getRoomNo());
    }

    private void requireRoutineFields(ClassRoutineDto dto) {
        if (dto == null) throw new BadRequestException("Class routine details are required");
        requireId(dto.getSchoolId(), "School is required");
        requireId(dto.getClassId(), "Class is required");
        requireId(dto.getSectionId(), "Section is required");
        requireId(dto.getSubjectId(), "Subject is required");
        requireId(dto.getTeacherId(), "Teacher is required");
        ensureSchoolReferences(dto);
        if (dto.getDay() == null || dto.getDay().isBlank()) throw new BadRequestException("Day is required");
        LocalTime start = parseTime(dto.getStartTime(), "Start time");
        LocalTime end = parseTime(dto.getEndTime(), "End time");
        if (!start.isBefore(end)) throw new BadRequestException("Start time must be before end time");
    }

    private void ensureSchoolReferences(ClassRoutineDto dto) {
        if (!schoolClassRepository.existsByIdAndSchool_Id(dto.getClassId(), dto.getSchoolId())) {
            throw new BadRequestException("Class does not belong to selected school");
        }
        if (!schoolSectionRepository.existsByIdAndSchool_IdAndSchoolClass_Id(
                dto.getSectionId(), dto.getSchoolId(), dto.getClassId())) {
            throw new BadRequestException("Section does not belong to selected class");
        }
        if (!subjectRepository.existsByIdAndSchool_Id(dto.getSubjectId(), dto.getSchoolId())) {
            throw new BadRequestException("Subject does not belong to selected school");
        }
        ManageTeacher teacher = teacherRepository.findById(dto.getTeacherId())
                .orElseThrow(() -> new BadRequestException("Teacher not found"));
        if (teacher.getSchoolId() != null && !teacher.getSchoolId().equals(dto.getSchoolId())) {
            throw new BadRequestException("Teacher does not belong to selected school");
        }
    }

    private void requireId(Long id, String message) {
        if (id == null) throw new BadRequestException(message);
    }

    private void ensureNoDuplicate(ClassRoutineDto dto, Long existingId) {
        LocalTime start = parseTime(dto.getStartTime(), "Start time");
        LocalTime end = parseTime(dto.getEndTime(), "End time");
        boolean exists = existingId == null
                ? repository.existsBySchoolIdAndClassIdAndSectionIdAndDayAndStartTimeAndEndTime(
                dto.getSchoolId(), dto.getClassId(), dto.getSectionId(), dto.getDay(), start, end)
                : repository.existsBySchoolIdAndClassIdAndSectionIdAndDayAndStartTimeAndEndTimeAndIdNot(
                dto.getSchoolId(), dto.getClassId(), dto.getSectionId(), dto.getDay(), start, end, existingId);
        if (exists) throw new BadRequestException("Class routine already exists for this time slot");
    }

    private LocalTime parseTime(String value, String label) {
        if (value == null || value.isBlank()) throw new BadRequestException(label + " is required");
        try {
            return LocalTime.parse(value);
        } catch (DateTimeException ex) {
            throw new BadRequestException(label + " is invalid");
        }
    }

    private ClassRoutineDto toDto(ClassRoutine routine) {
        ClassRoutineDto dto = new ClassRoutineDto();
        dto.setId(routine.getId());
        dto.setSchoolId(routine.getSchoolId());
        dto.setClassId(routine.getClassId());
        dto.setSectionId(routine.getSectionId());
        dto.setSubjectId(routine.getSubjectId());
        dto.setTeacherId(routine.getTeacherId());
        dto.setDay(routine.getDay());
        dto.setStartTime(routine.getStartTime() == null ? null : routine.getStartTime().toString());
        dto.setEndTime(routine.getEndTime() == null ? null : routine.getEndTime().toString());
        dto.setRoomNo(routine.getRoomNo());
        if (routine.getSchoolId() != null) {
            schoolRepository.findById(routine.getSchoolId()).ifPresent(school -> dto.setSchoolName(school.getSchoolName()));
        }
        if (routine.getClassId() != null) {
            schoolClassRepository.findById(routine.getClassId()).ifPresent(schoolClass -> dto.setClassName(schoolClass.getClassName()));
        }
        if (routine.getSectionId() != null) {
            schoolSectionRepository.findById(routine.getSectionId()).ifPresent(section -> dto.setSectionName(section.getName()));
        }
        if (routine.getSubjectId() != null) {
            subjectRepository.findById(routine.getSubjectId()).ifPresent(subject -> dto.setSubjectName(subject.getName()));
        }
        if (routine.getTeacherId() != null) {
            teacherRepository.findById(routine.getTeacherId()).ifPresent(teacher -> dto.setTeacherName(teacher.getName()));
        }
        return dto;
    }
}
