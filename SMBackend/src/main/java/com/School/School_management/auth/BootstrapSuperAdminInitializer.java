package com.School.School_management.auth;

import com.School.School_management.Entity.SuperAdmin;
import com.School.School_management.Repository.SuperAdminRepository;
import java.time.LocalDate;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class BootstrapSuperAdminInitializer implements ApplicationRunner {

    private final SuperAdminRepository superAdminRepository;
    private final AuthProperties authProperties;
    private final PasswordEncoder passwordEncoder;

    public BootstrapSuperAdminInitializer(
            SuperAdminRepository superAdminRepository,
            AuthProperties authProperties,
            PasswordEncoder passwordEncoder
    ) {
        this.superAdminRepository = superAdminRepository;
        this.authProperties = authProperties;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        String username = authProperties.username() == null || authProperties.username().isBlank()
                ? "admin"
                : authProperties.username().trim();
        String password = authProperties.password() == null || authProperties.password().isBlank()
                ? "Admin@123"
                : authProperties.password();

        if (superAdminRepository.findByUsername(username).isPresent()) return;

        SuperAdmin superAdmin = new SuperAdmin();
        superAdmin.setName("System Super Admin");
        superAdmin.setNationalId(null);
        superAdmin.setPhone("0000000000");
        superAdmin.setGender("Other");
        superAdmin.setBloodGroup(null);
        superAdmin.setReligion(null);
        superAdmin.setBirthDate(LocalDate.now());
        superAdmin.setPresentAddress(null);
        superAdmin.setPermanentAddress(null);
        superAdmin.setEmail(username.contains("@") ? username : null);
        superAdmin.setUsername(username);
        superAdmin.setPasswordHash(passwordEncoder.encode(password));
        superAdmin.setRole(Role.SUPER_ADMIN.name());
        superAdmin.setResumeUrl(null);
        superAdmin.setOtherInfo("Bootstrap super admin account for the legacy super-admin login.");
        superAdmin.setPhotoUrl(null);

        superAdminRepository.save(superAdmin);
    }
}
