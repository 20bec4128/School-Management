package com.School.School_management.Controller;

import com.School.School_management.Dto.SyllabusResponseDto;
import com.School.School_management.Service.SyllabusService;
import com.School.School_management.auth.RequirePagePermission;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.School.School_management.Entity.Syllabus;
import com.School.School_management.Repository.SyllabusRepository;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/syllabuses")
@RequirePagePermission(slug = "syllabus", action = "view")
public class SyllabusController {

    private final SyllabusService syllabusService;
    private final SyllabusRepository syllabusRepository;

    public SyllabusController(
            SyllabusService syllabusService,
            SyllabusRepository syllabusRepository
    ) {
        this.syllabusService = syllabusService;
        this.syllabusRepository = syllabusRepository;
    }

    @GetMapping
    @RequirePagePermission(slug = "syllabus", action = "view")
    public List<SyllabusResponseDto> getAllSyllabuses(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long classId
    ) {
        return syllabusService.getAllSyllabuses(schoolId, classId);
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "syllabus", action = "view")
    public SyllabusResponseDto getSyllabusById(@PathVariable Long id) {
        return syllabusService.getSyllabusById(id);
    }

    @PostMapping(consumes = "multipart/form-data")
    @RequirePagePermission(slug = "syllabus", action = "add")
    public SyllabusResponseDto createSyllabus(
            @RequestParam Long schoolId,
            @RequestParam Long classId,
            @RequestParam Long subjectId,
            @RequestParam String title,
            @RequestParam(required = false) String sessionYear,
            @RequestParam(required = false) String note,
            @RequestParam(required = false) MultipartFile file
    ) {
        return syllabusService.createSyllabus(
                schoolId,
                classId,
                subjectId,
                title,
                sessionYear,
                note,
                file
        );
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    @RequirePagePermission(slug = "syllabus", action = "edit")
    public SyllabusResponseDto updateSyllabus(
            @PathVariable Long id,
            @RequestParam Long schoolId,
            @RequestParam Long classId,
            @RequestParam Long subjectId,
            @RequestParam String title,
            @RequestParam(required = false) String sessionYear,
            @RequestParam(required = false) String note,
            @RequestParam(required = false) MultipartFile file
    ) {
        return syllabusService.updateSyllabus(
                id,
                schoolId,
                classId,
                subjectId,
                title,
                sessionYear,
                note,
                file
        );
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "syllabus", action = "delete")
    public String deleteSyllabus(@PathVariable Long id) {
        syllabusService.deleteSyllabus(id);
        return "Syllabus deleted successfully";
    }

    @GetMapping("/{id}/file")
    @RequirePagePermission(slug = "syllabus", action = "view")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        try {
            Syllabus syllabus = syllabusRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Syllabus not found"));

            Path path = Paths.get(syllabus.getFilePath());
            Resource resource = new UrlResource(path.toUri());

            return ResponseEntity.ok()
                    .header(
                            HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + syllabus.getFileName() + "\""
                    )
                    .body(resource);

        } catch (Exception e) {
            throw new RuntimeException("File not found");
        }
    }
}
