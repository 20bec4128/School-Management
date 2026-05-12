package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.ManageSchoolDto;
import com.School.School_management.Dto.CreateSchoolWithAdminRequest;
import com.School.School_management.Dto.CreateSchoolWithAdminResponse;
import com.School.School_management.Entity.AdminUser;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.ConflictException;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Repository.AdminUserRepository;
import com.School.School_management.Repository.HeadOfficeRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.ManageSchoolService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.config.UploadProperties;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
public class ManageSchoolServiceImpl implements ManageSchoolService {

    private final SchoolRepository schoolRepository;
    private final AdminUserRepository adminUserRepository;
    private final HeadOfficeRepository headOfficeRepository;
    private final PasswordEncoder passwordEncoder;

    private final Path schoolUploadDir;

    public ManageSchoolServiceImpl(
            SchoolRepository schoolRepository,
            AdminUserRepository adminUserRepository,
            HeadOfficeRepository headOfficeRepository,
            PasswordEncoder passwordEncoder,
            UploadProperties uploadProperties
    ) {
        this.schoolRepository = schoolRepository;
        this.adminUserRepository = adminUserRepository;
        this.headOfficeRepository = headOfficeRepository;
        this.passwordEncoder = passwordEncoder;
        this.schoolUploadDir = Paths.get(uploadProperties.getDir(), "schools").toAbsolutePath().normalize();
    }

    @Override
    public ManageSchoolDto createSchool(
            ManageSchoolDto dto,
            MultipartFile adminLogo,
            MultipartFile frontendLogo
    ) {
        ManageSchool school = toEntity(dto);
        CurrentUser user = CurrentUserHolder.get();
        applyScopeOnCreate(school, user);

        if (adminLogo != null && !adminLogo.isEmpty()) {
            school.setAdminLogoUrl(saveFile(adminLogo));
        }

        if (frontendLogo != null && !frontendLogo.isEmpty()) {
            school.setFrontendLogoUrl(saveFile(frontendLogo));
        }

        return toDto(schoolRepository.save(school));
    }

    @Override
    @Transactional
    public CreateSchoolWithAdminResponse createSchoolWithAdmin(
            CreateSchoolWithAdminRequest request,
            MultipartFile adminLogo,
            MultipartFile frontendLogo,
            CurrentUser user
    ) {
        if (request == null || request.getSchool() == null || request.getAdmin() == null) {
            throw new BadRequestException("School and admin details are required");
        }

        ManageSchool incomingSchool = toEntity(request.getSchool());
        applyScopeOnCreate(incomingSchool, user);

        ManageSchool school = resolveSchoolByUrl(incomingSchool);

        String username = normalizeRequired(request.getAdmin().getUsername(), "Admin username is required");
        String password = normalizeRequired(request.getAdmin().getPassword(), "Admin password is required");

        AdminUser existingAdmin = adminUserRepository.findByUsername(username).orElse(null);
        if (existingAdmin != null && !isSameSchool(existingAdmin, school)) {
            String details = String.format(
                    " (id=%s, role=%s, headOfficeId=%s, schoolId=%s, active=%s)",
                    existingAdmin.getId(),
                    existingAdmin.getRole(),
                    existingAdmin.getHeadOfficeId(),
                    existingAdmin.getSchoolId(),
                    existingAdmin.getActive()
            );
            throw new ConflictException("Admin username already exists" + details);
        }

        if (adminLogo != null && !adminLogo.isEmpty()) {
            school.setAdminLogoUrl(saveFile(adminLogo));
        }
        if (frontendLogo != null && !frontendLogo.isEmpty()) {
            school.setFrontendLogoUrl(saveFile(frontendLogo));
        }

        ManageSchool savedSchool = schoolRepository.save(school);

        if (existingAdmin != null && isSameSchool(existingAdmin, savedSchool)) {
            return new CreateSchoolWithAdminResponse(
                    toDto(savedSchool),
                    existingAdmin.getId(),
                    existingAdmin.getUsername()
            );
        }

        AdminUser admin = new AdminUser();
        admin.setUsername(username);
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setRole("SCHOOL_ADMIN");
        admin.setSchoolId(savedSchool.getId());
        admin.setHeadOfficeId(savedSchool.getHeadOfficeId());
        admin.setActive(Boolean.TRUE);

        AdminUser savedAdmin = adminUserRepository.save(admin);

        return new CreateSchoolWithAdminResponse(toDto(savedSchool), savedAdmin.getId(), savedAdmin.getUsername());
    }

    @Override
    public Page<ManageSchoolDto> getAllSchools(int page, int size, Long headOfficeId, Long schoolId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());

        if (schoolId != null) {
            return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                    .map(s -> new PageImpl<>(List.of(toDto(s)), pageable, 1))
                    .orElseGet(() -> new PageImpl<>(List.of(), pageable, 0));
        }

        if (headOfficeId != null) {
            return schoolRepository.findAllByIsDeletedFalseAndHeadOfficeId(headOfficeId, pageable)
                    .map(this::toDto);
        }

        return schoolRepository.findAll(pageable).map(this::toDto);
    }

    @Override
    public ManageSchoolDto getSchoolById(Long id) {
        ManageSchool school = schoolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("School not found"));

        return toDto(school);
    }

    @Override
    @Transactional
    public ManageSchoolDto updateSchool(
            Long id,
            ManageSchoolDto dto,
            MultipartFile adminLogo,
            MultipartFile frontendLogo
    ) {
        ManageSchool school = schoolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("School not found"));

        school.setSchoolUrl(dto.getSchoolUrl());
        school.setSchoolCode(dto.getSchoolCode());
        school.setSchoolName(dto.getSchoolName());
        school.setSubscription(dto.getSubscription());
        school.setIsDemo(dto.getIsDemo());
        school.setStatus(normalizeStatus(dto.getStatus()));
        school.setAddress(dto.getAddress());
        school.setPhone(dto.getPhone());
        school.setRegistrationDate(dto.getRegistrationDate());
        school.setEmail(dto.getEmail());
        school.setFax(dto.getFax());
        school.setFooter(dto.getFooter());

        school.setCurrency(dto.getCurrency());
        school.setCurrencySymbol(dto.getCurrencySymbol());
        school.setEnableFrontend(dto.getEnableFrontend());
        school.setExamFinalResult(dto.getExamFinalResult());
        school.setLanguage(dto.getLanguage());
        school.setTheme(dto.getTheme());
        school.setOnlineAdmission(dto.getOnlineAdmission());
        school.setEnableRTL(dto.getEnableRTL());
        school.setZoomApiKey(dto.getZoomApiKey());
        school.setZoomSecret(dto.getZoomSecret());
        school.setGoogleMapUrl(dto.getGoogleMapUrl());

        school.setFacebookUrl(dto.getFacebookUrl());
        school.setTwitterUrl(dto.getTwitterUrl());
        school.setLinkedinUrl(dto.getLinkedinUrl());
        school.setYoutubeUrl(dto.getYoutubeUrl());
        school.setInstagramUrl(dto.getInstagramUrl());
        school.setPinterestUrl(dto.getPinterestUrl());
        applyScopeOnUpdate(school, dto, CurrentUserHolder.get());
        updateSchoolAdminCredentials(school, dto);

        if (adminLogo != null && !adminLogo.isEmpty()) {
            school.setAdminLogoUrl(saveFile(adminLogo));
        }

        if (frontendLogo != null && !frontendLogo.isEmpty()) {
            school.setFrontendLogoUrl(saveFile(frontendLogo));
        }

        return toDto(schoolRepository.save(school));
    }

    @Override
    public void deleteSchool(Long id) {
        if (!schoolRepository.existsById(id)) {
            throw new RuntimeException("School not found");
        }

        schoolRepository.deleteById(id);
    }

    private String saveFile(MultipartFile file) {
        try {
            Files.createDirectories(schoolUploadDir);
            String originalName = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
            String sanitizedName = Paths.get(originalName).getFileName().toString().replaceAll("[^a-zA-Z0-9._-]", "_");
            String fileName = UUID.randomUUID() + "_" + sanitizedName;
            Path targetPath = schoolUploadDir.resolve(fileName).normalize();
            file.transferTo(targetPath.toFile());
            return "/uploads/schools/" + fileName;

        } catch (IOException e) {
            throw new RuntimeException("File upload failed: " + e.getMessage(), e);
        }
    }

    private ManageSchool toEntity(ManageSchoolDto dto) {
        ManageSchool school = new ManageSchool();
        school.setId(dto.getId());
        school.setSchoolUrl(dto.getSchoolUrl());
        school.setSchoolCode(dto.getSchoolCode());
        school.setSchoolName(dto.getSchoolName());
        school.setSubscription(dto.getSubscription());
        school.setIsDemo(dto.getIsDemo());
        school.setStatus(normalizeStatus(dto.getStatus()));
        school.setAddress(dto.getAddress());
        school.setPhone(dto.getPhone());
        school.setRegistrationDate(dto.getRegistrationDate());
        school.setEmail(dto.getEmail());
        school.setFax(dto.getFax());
        school.setFooter(dto.getFooter());
        school.setCurrency(dto.getCurrency());
        school.setCurrencySymbol(dto.getCurrencySymbol());
        school.setEnableFrontend(dto.getEnableFrontend());
        school.setExamFinalResult(dto.getExamFinalResult());
        school.setLanguage(dto.getLanguage());
        school.setTheme(dto.getTheme());
        school.setOnlineAdmission(dto.getOnlineAdmission());
        school.setEnableRTL(dto.getEnableRTL());
        school.setZoomApiKey(dto.getZoomApiKey());
        school.setZoomSecret(dto.getZoomSecret());
        school.setGoogleMapUrl(dto.getGoogleMapUrl());
        school.setFacebookUrl(dto.getFacebookUrl());
        school.setTwitterUrl(dto.getTwitterUrl());
        school.setLinkedinUrl(dto.getLinkedinUrl());
        school.setYoutubeUrl(dto.getYoutubeUrl());
        school.setInstagramUrl(dto.getInstagramUrl());
        school.setPinterestUrl(dto.getPinterestUrl());
        school.setHeadOfficeId(dto.getHeadOfficeId());
        school.setFrontendLogoUrl(dto.getFrontendLogoUrl());
        school.setAdminLogoUrl(dto.getAdminLogoUrl());
        return school;
    }

    private ManageSchool resolveSchoolByUrl(ManageSchool incomingSchool) {
        String schoolUrl = normalizeRequired(incomingSchool.getSchoolUrl(), "School URL is required");
        incomingSchool.setSchoolUrl(schoolUrl);
        return schoolRepository.findBySchoolUrlAndIsDeletedFalse(schoolUrl)
                .map(existing -> mergeSchool(existing, incomingSchool))
                .orElse(incomingSchool);
    }

    private ManageSchool mergeSchool(ManageSchool existing, ManageSchool incoming) {
        existing.setSchoolCode(incoming.getSchoolCode());
        existing.setSchoolName(incoming.getSchoolName());
        existing.setSubscription(incoming.getSubscription());
        existing.setIsDemo(incoming.getIsDemo());
        existing.setStatus(incoming.getStatus());
        existing.setAddress(incoming.getAddress());
        existing.setPhone(incoming.getPhone());
        existing.setRegistrationDate(incoming.getRegistrationDate());
        existing.setEmail(incoming.getEmail());
        existing.setFax(incoming.getFax());
        existing.setFooter(incoming.getFooter());
        existing.setCurrency(incoming.getCurrency());
        existing.setCurrencySymbol(incoming.getCurrencySymbol());
        existing.setEnableFrontend(incoming.getEnableFrontend());
        existing.setExamFinalResult(incoming.getExamFinalResult());
        existing.setLanguage(incoming.getLanguage());
        existing.setTheme(incoming.getTheme());
        existing.setOnlineAdmission(incoming.getOnlineAdmission());
        existing.setEnableRTL(incoming.getEnableRTL());
        existing.setZoomApiKey(incoming.getZoomApiKey());
        existing.setZoomSecret(incoming.getZoomSecret());
        existing.setGoogleMapUrl(incoming.getGoogleMapUrl());
        existing.setFacebookUrl(incoming.getFacebookUrl());
        existing.setTwitterUrl(incoming.getTwitterUrl());
        existing.setLinkedinUrl(incoming.getLinkedinUrl());
        existing.setYoutubeUrl(incoming.getYoutubeUrl());
        existing.setInstagramUrl(incoming.getInstagramUrl());
        existing.setPinterestUrl(incoming.getPinterestUrl());
        existing.setHeadOfficeId(incoming.getHeadOfficeId());
        return existing;
    }

    private boolean isSameSchool(AdminUser admin, ManageSchool school) {
        return admin != null
                && school != null
                && admin.getSchoolId() != null
                && admin.getSchoolId().equals(school.getId());
    }

    private void applyScopeOnCreate(ManageSchool school, CurrentUser user) {
        if (school == null) return;
        if (user != null && user.isHeadOfficeScopedAdmin() && user.headOfficeId() != null) {
            school.setHeadOfficeId(user.headOfficeId());
            return;
        }
        if (school.getHeadOfficeId() == null && headOfficeRepository != null) {
            headOfficeRepository.findByNameIgnoreCase("DEFAULT_HEAD_OFFICE")
                    .ifPresent(defaultHeadOffice -> school.setHeadOfficeId(defaultHeadOffice.getId()));
        }
    }

    private void applyScopeOnUpdate(ManageSchool school, ManageSchoolDto dto, CurrentUser user) {
        if (school == null) return;
        if (user != null && user.isHeadOfficeScopedAdmin() && user.headOfficeId() != null) {
            school.setHeadOfficeId(user.headOfficeId());
            return;
        }
        if (dto != null && dto.getHeadOfficeId() != null) {
            school.setHeadOfficeId(dto.getHeadOfficeId());
        }
    }

    private void updateSchoolAdminCredentials(ManageSchool school, ManageSchoolDto dto) {
        if (school == null || dto == null || school.getId() == null) return;

        String nextUsername = dto.getAdminUsername() == null ? "" : dto.getAdminUsername().trim();
        String nextPassword = dto.getAdminPassword() == null ? "" : dto.getAdminPassword().trim();
        if (nextUsername.isEmpty() && nextPassword.isEmpty()) return;

        AdminUser admin = adminUserRepository
                .findFirstBySchoolIdAndRoleOrderByIdAsc(school.getId(), "SCHOOL_ADMIN")
                .orElse(null);

        if (admin == null) {
            if (nextUsername.isEmpty() || nextPassword.isEmpty()) {
                throw new BadRequestException("School admin username and password are required");
            }
            admin = new AdminUser();
            admin.setRole("SCHOOL_ADMIN");
            admin.setActive(Boolean.TRUE);
        }

        if (!nextUsername.isEmpty() && !nextUsername.equalsIgnoreCase(admin.getUsername())) {
            Long adminId = admin.getId() == null ? -1L : admin.getId();
            if (adminUserRepository.existsByUsernameAndIdNot(nextUsername, adminId)) {
                throw new ConflictException("Admin username already exists");
            }
            admin.setUsername(nextUsername);
        }

        if (!nextPassword.isEmpty()) {
            admin.setPasswordHash(passwordEncoder.encode(nextPassword));
        }

        admin.setSchoolId(school.getId());
        admin.setHeadOfficeId(school.getHeadOfficeId());
        adminUserRepository.save(admin);
    }

    private String normalizeRequired(String value, String message) {
        if (value == null) throw new BadRequestException(message);
        String trimmed = value.trim();
        if (trimmed.isEmpty()) throw new BadRequestException(message);
        return trimmed;
    }

    private String normalizeStatus(String value) {
        String trimmed = value == null ? "" : value.trim();
        if (trimmed.isEmpty()) return "ACTIVE";
        String upper = trimmed.toUpperCase();
        // Accept UI-friendly values like "Active"/"Inactive" by normalizing case.
        if ("ACTIVE".equals(upper) || "INACTIVE".equals(upper)) return upper;
        // fallback: keep upper, DB constraint will enforce allowed values
        return upper;
    }

    private ManageSchoolDto toDto(ManageSchool school) {
        ManageSchoolDto dto = new ManageSchoolDto();
        dto.setId(school.getId());
        dto.setSchoolUrl(school.getSchoolUrl());
        dto.setSchoolCode(school.getSchoolCode());
        dto.setSchoolName(school.getSchoolName());
        dto.setSubscription(school.getSubscription());
        dto.setIsDemo(school.getIsDemo());
        dto.setStatus(school.getStatus());
        dto.setAddress(school.getAddress());
        dto.setPhone(school.getPhone());
        dto.setRegistrationDate(school.getRegistrationDate());
        dto.setEmail(school.getEmail());
        dto.setFax(school.getFax());
        dto.setFooter(school.getFooter());
        dto.setCurrency(school.getCurrency());
        dto.setCurrencySymbol(school.getCurrencySymbol());
        dto.setEnableFrontend(school.getEnableFrontend());
        dto.setExamFinalResult(school.getExamFinalResult());
        dto.setLanguage(school.getLanguage());
        dto.setTheme(school.getTheme());
        dto.setOnlineAdmission(school.getOnlineAdmission());
        dto.setEnableRTL(school.getEnableRTL());
        dto.setZoomApiKey(school.getZoomApiKey());
        dto.setZoomSecret(school.getZoomSecret());
        dto.setGoogleMapUrl(school.getGoogleMapUrl());
        dto.setFacebookUrl(school.getFacebookUrl());
        dto.setTwitterUrl(school.getTwitterUrl());
        dto.setLinkedinUrl(school.getLinkedinUrl());
        dto.setYoutubeUrl(school.getYoutubeUrl());
        dto.setInstagramUrl(school.getInstagramUrl());
        dto.setPinterestUrl(school.getPinterestUrl());
        dto.setHeadOfficeId(school.getHeadOfficeId());
        dto.setFrontendLogoUrl(school.getFrontendLogoUrl());
        dto.setAdminLogoUrl(school.getAdminLogoUrl());
        dto.setAdminUsername(resolveSchoolAdminUsername(school.getId()));
        return dto;
    }

    private String resolveSchoolAdminUsername(Long schoolId) {
        if (schoolId == null) return null;
        return adminUserRepository
                .findFirstBySchoolIdAndRoleOrderByIdAsc(schoolId, "SCHOOL_ADMIN")
                .map(AdminUser::getUsername)
                .orElse(null);
    }
}
