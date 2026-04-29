package com.School.School_management.Service.impl;

import com.School.School_management.Dto.ManageSchoolDto;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.ManageSchoolService;
import com.School.School_management.config.UploadProperties;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class ManageSchoolServiceImpl implements ManageSchoolService {

    private final SchoolRepository schoolRepository;

    private final Path schoolUploadDir;

    public ManageSchoolServiceImpl(
            SchoolRepository schoolRepository,
            UploadProperties uploadProperties
    ) {
        this.schoolRepository = schoolRepository;
        this.schoolUploadDir = Paths.get(uploadProperties.getDir(), "schools").toAbsolutePath().normalize();
    }

    @Override
    public ManageSchoolDto createSchool(
            ManageSchoolDto dto,
            MultipartFile adminLogo,
            MultipartFile frontendLogo
    ) {
        ManageSchool school = toEntity(dto);

        if (adminLogo != null && !adminLogo.isEmpty()) {
            school.setAdminLogoUrl(saveFile(adminLogo));
        }

        if (frontendLogo != null && !frontendLogo.isEmpty()) {
            school.setFrontendLogoUrl(saveFile(frontendLogo));
        }

        return toDto(schoolRepository.save(school));
    }

    @Override
    public Page<ManageSchoolDto> getAllSchools(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return schoolRepository.findAll(pageable)
                .map(this::toDto);
    }

    @Override
    public ManageSchoolDto getSchoolById(Long id) {
        ManageSchool school = schoolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("School not found"));

        return toDto(school);
    }

    @Override
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
        school.setStatus(dto.getStatus());
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
        school.setStatus(dto.getStatus());
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
        school.setFrontendLogoUrl(dto.getFrontendLogoUrl());
        school.setAdminLogoUrl(dto.getAdminLogoUrl());
        return school;
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
        dto.setFrontendLogoUrl(school.getFrontendLogoUrl());
        dto.setAdminLogoUrl(school.getAdminLogoUrl());
        return dto;
    }
}
