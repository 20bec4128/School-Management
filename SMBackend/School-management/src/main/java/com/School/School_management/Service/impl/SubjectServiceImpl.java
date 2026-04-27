package com.School.School_management.Service.impl;

import com.School.School_management.Dto.SubjectRequestDto;
import com.School.School_management.Dto.SubjectResponseDto;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.Subject;
import com.School.School_management.Entity.SchoolClass;
import com.School.School_management.Entity.ManageTeacher;
import com.School.School_management.Repository.SchoolClassRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.SubjectRepository;
import com.School.School_management.Repository.TeacherRepository;
import com.School.School_management.Service.SubjectService;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SubjectServiceImpl implements SubjectService {

    private final SubjectRepository subjectRepository;
    private final SchoolRepository schoolRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final TeacherRepository teacherRepository;

    public SubjectServiceImpl(
            SubjectRepository subjectRepository,
            SchoolRepository schoolRepository,
            SchoolClassRepository schoolClassRepository,
            TeacherRepository teacherRepository
    ) {
        this.subjectRepository = subjectRepository;
        this.schoolRepository = schoolRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.teacherRepository = teacherRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubjectResponseDto> getAllSubjects() {
        return subjectRepository.findAll()
                .stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SubjectResponseDto getSubjectById(Long id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subject not found with id: " + id));

        return mapToResponseDto(subject);
    }

    @Override
    public SubjectResponseDto createSubject(SubjectRequestDto requestDto) {
        Subject subject = new Subject();

        mapRequestToEntity(subject, requestDto);

        Subject savedSubject = subjectRepository.save(subject);

        return mapToResponseDto(savedSubject);
    }

    @Override
    public SubjectResponseDto updateSubject(Long id, SubjectRequestDto requestDto) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subject not found with id: " + id));

        mapRequestToEntity(subject, requestDto);

        Subject updatedSubject = subjectRepository.save(subject);

        return mapToResponseDto(updatedSubject);
    }

    @Override
    public void deleteSubject(Long id) {
        if (!subjectRepository.existsById(id)) {
            throw new RuntimeException("Subject not found with id: " + id);
        }

        subjectRepository.deleteById(id);
    }

    private void mapRequestToEntity(Subject subject, SubjectRequestDto requestDto) {
        ManageSchool school = schoolRepository.findById(requestDto.getSchoolId())
                .orElseThrow(() -> new RuntimeException("School not found with id: " + requestDto.getSchoolId()));

        SchoolClass schoolClass = schoolClassRepository.findById(requestDto.getClassId())
                .orElseThrow(() -> new RuntimeException("Class not found with id: " + requestDto.getClassId()));

        ManageTeacher teacher = requestDto.getTeacherId() == null
            ? null
            : teacherRepository.findById(requestDto.getTeacherId())
                .orElseThrow(() -> new RuntimeException("Teacher not found with id: " + requestDto.getTeacherId()));

        subject.setSchool(school);
        subject.setSchoolClass(schoolClass);
        subject.setTeacher(teacher);

        subject.setName(requestDto.getName());
        subject.setSubjectCode(requestDto.getSubjectCode());
        subject.setAuthor(requestDto.getAuthor());
        subject.setType(requestDto.getType());
        subject.setNote(requestDto.getNote());
    }

    private SubjectResponseDto mapToResponseDto(Subject subject) {
        SubjectResponseDto responseDto = new SubjectResponseDto();

        responseDto.setId(subject.getId());

        if (subject.getSchool() != null) {
            responseDto.setSchoolId(subject.getSchool().getId());
            responseDto.setSchool(subject.getSchool().getSchoolName());
        }

        if (subject.getSchoolClass() != null) {
            responseDto.setClassId(subject.getSchoolClass().getId());
            responseDto.setClassName(subject.getSchoolClass().getClassName());
        }

        if (subject.getTeacher() != null) {
            responseDto.setTeacherId(subject.getTeacher().getId());
            responseDto.setTeacher(subject.getTeacher().getName());
        }

        responseDto.setName(subject.getName());
        responseDto.setSubjectCode(subject.getSubjectCode());
        responseDto.setAuthor(subject.getAuthor());
        responseDto.setType(subject.getType());
        responseDto.setNote(subject.getNote());

        return responseDto;
    }
}
