package com.School.School_management.Service;

import com.School.School_management.Dto.SyllabusResponseDto;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.SchoolClass;
import com.School.School_management.Entity.Subject;
import com.School.School_management.Entity.Syllabus;
import com.School.School_management.Repository.SchoolClassRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.SubjectRepository;
import com.School.School_management.Repository.SyllabusRepository;
import com.School.School_management.Service.SyllabusService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class SyllabusServiceImpl implements SyllabusService {

    private final SyllabusRepository syllabusRepository;
    private final SchoolRepository schoolRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SubjectRepository subjectRepository;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public SyllabusServiceImpl(
            SyllabusRepository syllabusRepository,
            SchoolRepository schoolRepository,
            SchoolClassRepository schoolClassRepository,
            SubjectRepository subjectRepository
    ) {
        this.syllabusRepository = syllabusRepository;
        this.schoolRepository = schoolRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.subjectRepository = subjectRepository;
    }

    @Override
    public List<SyllabusResponseDto> getAllSyllabuses() {
        return syllabusRepository.findAll()
                .stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    @Override
    public SyllabusResponseDto getSyllabusById(Long id) {
        Syllabus syllabus = syllabusRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Syllabus not found with id: " + id));

        return mapToResponseDto(syllabus);
    }

    @Override
    public SyllabusResponseDto createSyllabus(
            Long schoolId,
            Long classId,
            Long subjectId,
            String title,
            String sessionYear,
            String note,
            MultipartFile file
    ) {
        Syllabus syllabus = new Syllabus();

        mapFieldsToEntity(syllabus, schoolId, classId, subjectId, title, sessionYear, note);

        if (file != null && !file.isEmpty()) {
            saveFile(syllabus, file);
        }

        return mapToResponseDto(syllabusRepository.save(syllabus));
    }

    @Override
    public SyllabusResponseDto updateSyllabus(
            Long id,
            Long schoolId,
            Long classId,
            Long subjectId,
            String title,
            String sessionYear,
            String note,
            MultipartFile file
    ) {
        Syllabus syllabus = syllabusRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Syllabus not found with id: " + id));

        mapFieldsToEntity(syllabus, schoolId, classId, subjectId, title, sessionYear, note);

        if (file != null && !file.isEmpty()) {
            saveFile(syllabus, file);
        }

        return mapToResponseDto(syllabusRepository.save(syllabus));
    }

    @Override
    public void deleteSyllabus(Long id) {
        if (!syllabusRepository.existsById(id)) {
            throw new RuntimeException("Syllabus not found with id: " + id);
        }

        syllabusRepository.deleteById(id);
    }

    private void mapFieldsToEntity(
            Syllabus syllabus,
            Long schoolId,
            Long classId,
            Long subjectId,
            String title,
            String sessionYear,
            String note
    ) {
        ManageSchool school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new RuntimeException("School not found with id: " + schoolId));

        SchoolClass schoolClass = schoolClassRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found with id: " + classId));

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found with id: " + subjectId));

        syllabus.setSchool(school);
        syllabus.setSchoolClass(schoolClass);
        syllabus.setSubject(subject);

        syllabus.setTitle(title);
        syllabus.setSessionYear(sessionYear);
        syllabus.setNote(note);
    }

    private void saveFile(Syllabus syllabus, MultipartFile file) {
        try {
            Path folderPath = Paths.get(uploadDir, "syllabuses");
            Files.createDirectories(folderPath);

            String originalName = file.getOriginalFilename();
            String storedName = UUID.randomUUID() + "_" + originalName;

            Path filePath = folderPath.resolve(storedName);
            Files.copy(file.getInputStream(), filePath);

            syllabus.setFileName(originalName);
            syllabus.setFileType(file.getContentType());
            syllabus.setFilePath(filePath.toString());

        } catch (Exception e) {
            throw new RuntimeException("Failed to upload syllabus file");
        }
    }

    private SyllabusResponseDto mapToResponseDto(Syllabus syllabus) {
        SyllabusResponseDto dto = new SyllabusResponseDto();

        dto.setId(syllabus.getId());

        if (syllabus.getSchool() != null) {
            dto.setSchoolId(syllabus.getSchool().getId());
            dto.setSchool(syllabus.getSchool().getSchoolName());
        }

        if (syllabus.getSchoolClass() != null) {
            dto.setClassId(syllabus.getSchoolClass().getId());
            dto.setClassName(syllabus.getSchoolClass().getClassName());
        }

        if (syllabus.getSubject() != null) {
            dto.setSubjectId(syllabus.getSubject().getId());
            dto.setSubject(syllabus.getSubject().getName());
        }

        dto.setTitle(syllabus.getTitle());
        dto.setSessionYear(syllabus.getSessionYear());
        dto.setNote(syllabus.getNote());

        dto.setFileName(syllabus.getFileName());
        dto.setFileType(syllabus.getFileType());

        if (syllabus.getFilePath() != null) {
            dto.setFileUrl("/api/syllabuses/" + syllabus.getId() + "/file");
        }

        return dto;
    }
}
