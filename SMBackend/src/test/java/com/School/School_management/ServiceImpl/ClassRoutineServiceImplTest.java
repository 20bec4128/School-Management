package com.School.School_management.ServiceImpl;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.School.School_management.Dto.ClassRoutineDto;
import com.School.School_management.Entity.ManageTeacher;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Repository.ClassRoutineRepository;
import com.School.School_management.Repository.SchoolClassRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.SchoolSectionRepository;
import com.School.School_management.Repository.SubjectRepository;
import com.School.School_management.Repository.TeacherRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ClassRoutineServiceImplTest {

    @Mock
    private ClassRoutineRepository repository;

    @Mock
    private SchoolRepository schoolRepository;

    @Mock
    private SchoolClassRepository schoolClassRepository;

    @Mock
    private SchoolSectionRepository schoolSectionRepository;

    @Mock
    private SubjectRepository subjectRepository;

    @Mock
    private TeacherRepository teacherRepository;

    private ClassRoutineServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ClassRoutineServiceImpl(
                repository,
                schoolRepository,
                schoolClassRepository,
                schoolSectionRepository,
                subjectRepository,
                teacherRepository
        );
        lenient().when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void createAllowsTeacherWithMissingSchoolId() {
        ClassRoutineDto dto = validDto();
        ManageTeacher teacher = new ManageTeacher();
        teacher.setId(dto.getTeacherId());
        teacher.setSchoolId(null);

        when(schoolClassRepository.existsByIdAndSchool_Id(dto.getClassId(), dto.getSchoolId())).thenReturn(true);
        when(schoolSectionRepository.existsByIdAndSchool_IdAndSchoolClass_Id(dto.getSectionId(), dto.getSchoolId(), dto.getClassId()))
                .thenReturn(true);
        when(subjectRepository.existsByIdAndSchool_Id(dto.getSubjectId(), dto.getSchoolId())).thenReturn(true);
        when(teacherRepository.findById(dto.getTeacherId())).thenReturn(Optional.of(teacher));

        assertDoesNotThrow(() -> service.create(dto));
    }

    @Test
    void createRejectsTeacherFromDifferentSchool() {
        ClassRoutineDto dto = validDto();
        ManageTeacher teacher = new ManageTeacher();
        teacher.setId(dto.getTeacherId());
        teacher.setSchoolId(dto.getSchoolId() + 1);

        when(schoolClassRepository.existsByIdAndSchool_Id(dto.getClassId(), dto.getSchoolId())).thenReturn(true);
        when(schoolSectionRepository.existsByIdAndSchool_IdAndSchoolClass_Id(dto.getSectionId(), dto.getSchoolId(), dto.getClassId()))
                .thenReturn(true);
        when(subjectRepository.existsByIdAndSchool_Id(dto.getSubjectId(), dto.getSchoolId())).thenReturn(true);
        when(teacherRepository.findById(dto.getTeacherId())).thenReturn(Optional.of(teacher));

        assertThrows(BadRequestException.class, () -> service.create(dto));
    }

    private ClassRoutineDto validDto() {
        ClassRoutineDto dto = new ClassRoutineDto();
        dto.setSchoolId(1L);
        dto.setClassId(2L);
        dto.setSectionId(3L);
        dto.setSubjectId(4L);
        dto.setTeacherId(5L);
        dto.setDay("Monday");
        dto.setStartTime("09:00");
        dto.setEndTime("10:00");
        dto.setRoomNo("101");
        return dto;
    }
}
