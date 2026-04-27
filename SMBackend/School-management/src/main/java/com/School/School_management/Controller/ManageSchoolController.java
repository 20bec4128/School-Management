package com.School.School_management.Controller;

import com.School.School_management.Dto.ManageSchoolDto;
import com.School.School_management.Service.ManageSchoolService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/schools")
public class ManageSchoolController {

    private final ManageSchoolService manageSchoolService;
    private final ObjectMapper objectMapper;

    public ManageSchoolController(ManageSchoolService manageSchoolService, ObjectMapper objectMapper) {
        this.manageSchoolService = manageSchoolService;
        this.objectMapper = objectMapper;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ManageSchoolDto createSchool(
            @RequestPart("data") String data,
            @RequestPart(value = "adminLogo", required = false) MultipartFile adminLogo,
            @RequestPart(value = "frontendLogo", required = false) MultipartFile frontendLogo
    ) throws Exception {

        ManageSchoolDto dto = objectMapper.readValue(data, ManageSchoolDto.class);
        return manageSchoolService.createSchool(dto, adminLogo, frontendLogo);
    }

    @GetMapping
    public Page<ManageSchoolDto> getAllSchools(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return manageSchoolService.getAllSchools(page, size);
    }

    @GetMapping("/{id}")
    public ManageSchoolDto getSchoolById(@PathVariable Long id) {
        return manageSchoolService.getSchoolById(id);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ManageSchoolDto updateSchool(
            @PathVariable Long id,
            @RequestPart("data") String data,
            @RequestPart(value = "adminLogo", required = false) MultipartFile adminLogo,
            @RequestPart(value = "frontendLogo", required = false) MultipartFile frontendLogo
    ) throws Exception {

        ManageSchoolDto dto = objectMapper.readValue(data, ManageSchoolDto.class);
        return manageSchoolService.updateSchool(id, dto, adminLogo, frontendLogo);
    }

    @DeleteMapping("/{id}")
    public String deleteSchool(@PathVariable Long id) {
        manageSchoolService.deleteSchool(id);
        return "School deleted successfully";
    }
}
