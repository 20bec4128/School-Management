package com.School.School_management.Controller;

import com.School.School_management.Dto.ManageTeacherDto;
import com.School.School_management.Service.ManageTeacherService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/teachers")
public class ManageTeacherController {

    private final ManageTeacherService manageTeacherService;
    private final ObjectMapper objectMapper;

    public ManageTeacherController(ManageTeacherService manageTeacherService, ObjectMapper objectMapper) {
        this.manageTeacherService = manageTeacherService;
        this.objectMapper = objectMapper;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ManageTeacherDto createTeacher(
            @RequestPart("data") String data,
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @RequestPart(value = "resume", required = false) MultipartFile resume
    ) throws Exception {
        ManageTeacherDto dto = objectMapper.readValue(data, ManageTeacherDto.class);
        return manageTeacherService.createTeacher(dto, photo, resume);
    }

    @GetMapping
    public List<ManageTeacherDto> getAllTeachers() {
        return manageTeacherService.getAllTeachers();
    }

    @GetMapping("/{id}")
    public ManageTeacherDto getTeacherById(@PathVariable Long id) {
        return manageTeacherService.getTeacherById(id);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ManageTeacherDto updateTeacher(
            @PathVariable Long id,
            @RequestPart("data") String data,
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @RequestPart(value = "resume", required = false) MultipartFile resume
    ) throws Exception {
        ManageTeacherDto dto = objectMapper.readValue(data, ManageTeacherDto.class);
        return manageTeacherService.updateTeacher(id, dto, photo, resume);
    }

    @DeleteMapping("/{id}")
    public String deleteTeacher(@PathVariable Long id) {
        manageTeacherService.deleteTeacher(id);
        return "Teacher deleted successfully";
    }
}
