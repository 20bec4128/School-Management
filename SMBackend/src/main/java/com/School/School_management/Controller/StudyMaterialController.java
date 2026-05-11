// Controller/StudyMaterialController.java
package com.School.School_management.Controller;

import com.School.School_management.Dto.StudyMaterialRequestDto;
import com.School.School_management.Dto.StudyMaterialResponseDto;
import com.School.School_management.Service.StudyMaterialService;
import com.School.School_management.auth.RequirePermission;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/study-materials")
public class StudyMaterialController {

    private final StudyMaterialService service;
    private final ObjectMapper objectMapper;

    public StudyMaterialController(StudyMaterialService service, ObjectMapper objectMapper) {
        this.service = service;
        this.objectMapper = objectMapper;
    }

    @RequirePermission({"STUDY_MATERIAL_MANAGE", "STUDY_MATERIAL_MANAGE_ASSIGNED", "*"})
    @PostMapping(consumes = "multipart/form-data")
    public StudyMaterialResponseDto create(
            @RequestPart("data") String data,
            @RequestPart(value = "material", required = false) MultipartFile material
    ) throws Exception {
        StudyMaterialRequestDto dto = objectMapper.readValue(data, StudyMaterialRequestDto.class);
        return service.create(dto, material);
    }

    @RequirePermission({"STUDY_MATERIAL_MANAGE", "STUDY_MATERIAL_VIEW_OWN", "STUDY_MATERIAL_VIEW_CHILD", "STUDY_MATERIAL_MANAGE_ASSIGNED", "*"})
    @GetMapping
    public List<StudyMaterialResponseDto> getAll(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long subjectId
    ) {
        return service.getAll(schoolId, classId, subjectId);
    }

    @RequirePermission({"STUDY_MATERIAL_MANAGE", "STUDY_MATERIAL_MANAGE_ASSIGNED", "*"})
    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public StudyMaterialResponseDto update(
            @PathVariable Long id,
            @RequestPart("data") String data,
            @RequestPart(value = "material", required = false) MultipartFile material
    ) throws Exception {
        StudyMaterialRequestDto dto = objectMapper.readValue(data, StudyMaterialRequestDto.class);
        return service.update(id, dto, material);
    }

    @RequirePermission({"STUDY_MATERIAL_MANAGE", "STUDY_MATERIAL_MANAGE_ASSIGNED", "*"})
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
