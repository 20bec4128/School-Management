package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.SuperAdminDto;
import com.School.School_management.Entity.AdminUser;
import com.School.School_management.Entity.SuperAdmin;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.AdminUserRepository;
import com.School.School_management.Repository.SuperAdminRepository;
import com.School.School_management.Service.SuperAdminService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.config.UploadProperties;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
public class SuperAdminServiceImpl implements SuperAdminService {

    private final SuperAdminRepository superAdminRepository;
    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final Path uploadDir;

    public SuperAdminServiceImpl(
            SuperAdminRepository superAdminRepository,
            AdminUserRepository adminUserRepository,
            PasswordEncoder passwordEncoder,
            UploadProperties uploadProperties
    ) {
        this.superAdminRepository = superAdminRepository;
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.uploadDir = Paths.get(uploadProperties.getDir(), "super_admins").toAbsolutePath().normalize();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SuperAdmin> getSuperAdmins(String search, String name, String email, String phone, int page, int size) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return superAdminRepository.findAll(buildSpec(search, name, email, phone), pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public SuperAdmin getSuperAdminById(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        return superAdminRepository.findById(id).orElseThrow(NotFoundException::new);
    }

    @Override
    public SuperAdmin createSuperAdmin(SuperAdminDto dto, MultipartFile photo, MultipartFile resume) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        // Check if username already exists
        String username = required(dto.getUsername(), "Username is required");
        if (superAdminRepository.findByUsername(username).isPresent()) {
            throw new BadRequestException("Username is already taken");
        }
        if (adminUserRepository.findByUsername(username).isPresent()) {
            throw new BadRequestException("Username is already taken");
        }

        SuperAdmin sa = new SuperAdmin();
        applyDto(sa, dto);

        String password = required(dto.getPassword(), "Password is required");
        sa.setPasswordHash(passwordEncoder.encode(password));
        syncAdminUser(null, username, password);

        if (photo != null && !photo.isEmpty()) {
            sa.setPhotoUrl(saveFile(photo));
        }
        if (resume != null && !resume.isEmpty()) {
            sa.setResumeUrl(saveFile(resume));
        }

        return superAdminRepository.save(sa);
    }

    @Override
    public SuperAdmin updateSuperAdmin(Long id, SuperAdminDto dto, MultipartFile photo, MultipartFile resume) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        SuperAdmin existing = superAdminRepository.findById(id).orElseThrow(NotFoundException::new);
        String oldUsername = existing.getUsername();

        // If username is changing, ensure new one is unique
        String nextUsername = trim(dto.getUsername());
        if (nextUsername != null && !nextUsername.equals(existing.getUsername())) {
            if (superAdminRepository.findByUsername(nextUsername).isPresent()) {
                throw new BadRequestException("Username is already taken");
            }
            if (adminUserRepository.findByUsername(nextUsername).isPresent()) {
                throw new BadRequestException("Username is already taken");
            }
        }

        applyDto(existing, dto);

        String nextPassword = trim(dto.getPassword());
        if (nextPassword != null) {
            existing.setPasswordHash(passwordEncoder.encode(nextPassword));
        }
        syncAdminUser(oldUsername, existing.getUsername(), nextPassword);

        if (photo != null && !photo.isEmpty()) {
            existing.setPhotoUrl(saveFile(photo));
        }
        if (resume != null && !resume.isEmpty()) {
            existing.setResumeUrl(saveFile(resume));
        }

        return superAdminRepository.save(existing);
    }

    @Override
    public void deleteSuperAdmin(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        SuperAdmin existing = superAdminRepository.findById(id).orElseThrow(NotFoundException::new);
        superAdminRepository.delete(existing);
    }

    private void applyDto(SuperAdmin sa, SuperAdminDto dto) {
        if (dto == null) return;

        sa.setName(required(dto.getName(), "Name is required"));
        sa.setNationalId(trim(dto.getNationalId()));
        sa.setPhone(required(dto.getPhone(), "Phone is required"));
        sa.setGender(required(dto.getGender(), "Gender is required"));
        sa.setBloodGroup(trim(dto.getBloodGroup()));
        sa.setReligion(trim(dto.getReligion()));
        sa.setBirthDate(dto.getBirthDate() != null ? dto.getBirthDate() : java.time.LocalDate.now());

        sa.setPresentAddress(trim(dto.getPresentAddress()));
        sa.setPermanentAddress(trim(dto.getPermanentAddress()));

        sa.setEmail(trim(dto.getEmail()));
        sa.setUsername(required(dto.getUsername(), "Username is required"));
        sa.setRole(required(dto.getRole(), "Role is required"));
        sa.setOtherInfo(trim(dto.getOtherInfo()));

        if (dto.getPhotoUrl() != null) {
            sa.setPhotoUrl(dto.getPhotoUrl());
        }
        if (dto.getResumeUrl() != null) {
            sa.setResumeUrl(dto.getResumeUrl());
        }
    }

    private String saveFile(MultipartFile file) {
        try {
            Files.createDirectories(uploadDir);
            String originalName = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
            String sanitizedName = Paths.get(originalName).getFileName().toString().replaceAll("[^a-zA-Z0-9._-]", "_");
            String fileName = UUID.randomUUID() + "_" + sanitizedName;

            Path targetPath = uploadDir.resolve(fileName).normalize();
            file.transferTo(targetPath.toFile());

            return "/uploads/super_admins/" + fileName;
        } catch (IOException ex) {
            throw new RuntimeException("File upload failed: " + ex.getMessage(), ex);
        }
    }

    private String trim(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }

    private String required(String v, String msg) {
        String t = trim(v);
        if (t == null) throw new BadRequestException(msg);
        return t;
    }

    private void syncAdminUser(String previousUsername, String nextUsername, String rawPassword) {
        String targetUsername = trim(nextUsername);
        if (targetUsername == null) return;

        AdminUser adminUser = null;
        if (previousUsername != null && !previousUsername.isBlank()) {
            adminUser = adminUserRepository.findByUsername(previousUsername).orElse(null);
        }
        if (adminUser == null) {
            adminUser = adminUserRepository.findByUsername(targetUsername).orElse(null);
        }
        if (adminUser == null) {
            adminUser = new AdminUser();
        }

        adminUser.setUsername(targetUsername);
        adminUser.setRole("SUPER_ADMIN");
        adminUser.setSchoolId(null);
        adminUser.setHeadOfficeId(null);
        adminUser.setActive(Boolean.TRUE);

        if (rawPassword != null && !rawPassword.isBlank()) {
            adminUser.setPasswordHash(passwordEncoder.encode(rawPassword));
        } else if (adminUser.getPasswordHash() == null || adminUser.getPasswordHash().isBlank()) {
            throw new BadRequestException("Password is required");
        }

        adminUserRepository.save(adminUser);
    }

    private String normalize(String v) {
        return trim(v);
    }

    private Specification<SuperAdmin> buildSpec(String search, String name, String email, String phone) {
        String normalizedSearch = normalize(search);
        String normalizedName = normalize(name);
        String normalizedEmail = normalize(email);
        String normalizedPhone = normalize(phone);

        return (root, query, cb) -> {
            java.util.List<Predicate> predicates = new java.util.ArrayList<>();

            if (normalizedSearch != null) {
                String like = "%" + normalizedSearch.toLowerCase() + "%";
                Predicate searchPredicate = cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("email")), like),
                        cb.like(cb.lower(root.get("phone")), like)
                );
                predicates.add(searchPredicate);
            }

            if (normalizedName != null) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + normalizedName.toLowerCase() + "%"));
            }

            if (normalizedEmail != null) {
                predicates.add(cb.like(cb.lower(root.get("email")), "%" + normalizedEmail.toLowerCase() + "%"));
            }

            if (normalizedPhone != null) {
                predicates.add(cb.like(cb.lower(root.get("phone")), "%" + normalizedPhone.toLowerCase() + "%"));
            }

            return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
