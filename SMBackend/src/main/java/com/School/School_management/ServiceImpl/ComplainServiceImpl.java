package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.ComplainDto;
import com.School.School_management.Entity.Complain;
import com.School.School_management.Entity.ComplainType;
import com.School.School_management.Entity.ManageTeacher;
import com.School.School_management.Entity.Student;
import com.School.School_management.Repository.ComplainRepository;
import com.School.School_management.Repository.ComplainTypeRepository;
import com.School.School_management.Repository.StudentRepository;
import com.School.School_management.Repository.TeacherRepository;
import com.School.School_management.Service.ComplainService;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ComplainServiceImpl implements ComplainService {

    private final ComplainRepository repository;
    private final ComplainTypeRepository complainTypeRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;

    public ComplainServiceImpl(
            ComplainRepository repository,
            ComplainTypeRepository complainTypeRepository,
            StudentRepository studentRepository,
            TeacherRepository teacherRepository
    ) {
        this.repository = repository;
        this.complainTypeRepository = complainTypeRepository;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ComplainDto> getAllBySchool(Long schoolId) {
        return repository.findBySchoolIdAndIsDeletedFalse(schoolId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ComplainDto> pageBySchool(Long schoolId, String search, String academicYear, Long complainTypeId, String userType, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        final String q = normalize(search);
        final String ay = normalizeSelect(academicYear);
        final String ut = normalizeSelect(userType);
        List<ComplainDto> filtered = repository.findBySchoolIdAndIsDeletedFalse(schoolId).stream()
                .map(this::toDto)
                .filter(dto -> matches(dto, q, ay, complainTypeId, ut))
                .sorted(Comparator.comparing(ComplainDto::getComplainDate, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(ComplainDto::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
        int start = Math.min(pageable.getPageNumber() * pageable.getPageSize(), filtered.size());
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        return new PageImpl<>(filtered.subList(start, end), pageable, filtered.size());
    }

    @Override
    public ComplainDto save(ComplainDto dto) {
        Complain entity = new Complain();
        mapDtoToEntity(dto, entity);
        return toDto(repository.save(entity));
    }

    @Override
    public ComplainDto update(Long id, ComplainDto dto) {
        Complain entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complain not found"));
        mapDtoToEntity(dto, entity);
        return toDto(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        Complain entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complain not found"));
        entity.setIsDeleted(true);
        repository.save(entity);
    }

    private void mapDtoToEntity(ComplainDto dto, Complain entity) {
        entity.setSchoolId(dto.getSchoolId());
        entity.setAcademicYear(dto.getAcademicYear());
        entity.setUserType(dto.getUserType());
        Student student = null;
        if (dto.getStudentId() != null) {
            student = studentRepository.findById(dto.getStudentId())
                    .orElseThrow(() -> new RuntimeException("Student not found"));
        }
        entity.setStudent(student);

        ManageTeacher teacher = null;
        if (dto.getTeacherId() != null) {
            teacher = teacherRepository.findById(dto.getTeacherId())
                    .orElseThrow(() -> new RuntimeException("Teacher not found"));
        }
        entity.setTeacher(teacher);

        String complainBy = normalize(dto.getComplainBy());
        if (complainBy == null) {
            if (student != null && student.getName() != null) {
                complainBy = student.getName();
            } else if (teacher != null && teacher.getName() != null) {
                complainBy = teacher.getName();
            }
        }
        entity.setComplainBy(complainBy);
        entity.setComplainDate(dto.getComplainDate());
        entity.setActionDate(dto.getActionDate());
        entity.setComplain(dto.getComplain());

        if (dto.getComplainTypeId() != null) {
            ComplainType complainType = complainTypeRepository.findById(dto.getComplainTypeId())
                    .orElseThrow(() -> new RuntimeException("Complain Type not found"));
            entity.setComplainType(complainType);
        } else {
            entity.setComplainType(null);
        }
    }

    private ComplainDto toDto(Complain entity) {
        ComplainDto dto = new ComplainDto();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setAcademicYear(entity.getAcademicYear());
        dto.setUserType(entity.getUserType());
        dto.setComplainBy(entity.getComplainBy());
        if (entity.getStudent() != null) {
            dto.setStudentId(entity.getStudent().getId());
            dto.setStudentName(entity.getStudent().getName());
            if (entity.getStudent().getSchoolClass() != null) {
                dto.setStudentClassId(entity.getStudent().getSchoolClass().getId());
                String className = entity.getStudent().getSchoolClass().getClassName();
                if (className == null || className.trim().isEmpty()) {
                    className = entity.getStudent().getSchoolClass().getNumericName();
                }
                dto.setStudentClassName(className);
            } else {
                dto.setStudentClassName(entity.getStudent().getClassName());
            }
        }
        if (entity.getTeacher() != null) {
            dto.setTeacherId(entity.getTeacher().getId());
            dto.setTeacherName(entity.getTeacher().getName());
        }
        dto.setComplainDate(entity.getComplainDate());
        dto.setActionDate(entity.getActionDate());
        dto.setComplain(entity.getComplain());
        if (entity.getComplainType() != null) {
            dto.setComplainTypeId(entity.getComplainType().getId());
            dto.setComplainTypeName(entity.getComplainType().getComplainType());
        }
        return dto;
    }

    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeSelect(String value) {
        String normalized = normalize(value);
        if (normalized == null || "Select".equalsIgnoreCase(normalized)) {
            return null;
        }
        return normalized;
    }

    private boolean matches(ComplainDto dto, String search, String academicYear, Long complainTypeId, String userType) {
        if (academicYear != null && !academicYear.equalsIgnoreCase(dto.getAcademicYear())) {
            return false;
        }
        if (userType != null && !userType.equalsIgnoreCase(dto.getUserType())) {
            return false;
        }
        if (complainTypeId != null && !Objects.equals(dto.getComplainTypeId(), complainTypeId)) {
            return false;
        }
        if (search == null) {
            return true;
        }
        String q = search.toLowerCase(Locale.ROOT);
        return containsIgnoreCase(dto.getComplainBy(), q)
                || containsIgnoreCase(dto.getStudentName(), q)
                || containsIgnoreCase(dto.getTeacherName(), q)
                || containsIgnoreCase(dto.getAcademicYear(), q)
                || containsIgnoreCase(dto.getUserType(), q)
                || containsIgnoreCase(dto.getComplainTypeName(), q)
                || containsIgnoreCase(dto.getComplain(), q);
    }

    private boolean containsIgnoreCase(String value, String query) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(query);
    }
}
