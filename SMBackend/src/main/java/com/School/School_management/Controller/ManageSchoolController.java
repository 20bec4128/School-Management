package com.School.School_management.Controller;

import com.School.School_management.Dto.ManageSchoolDto;
import com.School.School_management.Dto.CreateSchoolWithAdminRequest;
import com.School.School_management.Dto.CreateSchoolWithAdminResponse;
import com.School.School_management.Service.ManageSchoolService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.auth.RequirePermission;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/schools")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class ManageSchoolController {

    private final ManageSchoolService manageSchoolService;
    private final ObjectMapper objectMapper;

    public ManageSchoolController(ManageSchoolService manageSchoolService, ObjectMapper objectMapper) {
        this.manageSchoolService = manageSchoolService;
        this.objectMapper = objectMapper;
    }

    @PostMapping(value = "/create-with-admin", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CreateSchoolWithAdminResponse createSchoolWithAdmin(
            @RequestPart("data") String data,
            @RequestPart(value = "adminLogo", required = false) MultipartFile adminLogo,
            @RequestPart(value = "frontendLogo", required = false) MultipartFile frontendLogo
    ) throws Exception {
        CreateSchoolWithAdminRequest req = objectMapper.readValue(data, CreateSchoolWithAdminRequest.class);
        return manageSchoolService.createSchoolWithAdmin(req, adminLogo, frontendLogo, CurrentUserHolder.get());
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
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId
    ) {
        CurrentUser user = CurrentUserHolder.get();
        if (user != null) {
            if (user.isSchoolScoped() && user.schoolId() != null) {
                schoolId = user.schoolId();
                headOfficeId = null;
            } else if (user.isHeadOfficeScopedAdmin() && user.headOfficeId() != null) {
                headOfficeId = user.headOfficeId();
            }
        }
        return manageSchoolService.getAllSchools(page, size, headOfficeId, schoolId, search, status);
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
