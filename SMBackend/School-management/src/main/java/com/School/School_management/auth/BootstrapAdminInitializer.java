package com.School.School_management.auth;

import com.School.School_management.Entity.AdminUser;
import com.School.School_management.Repository.AdminUserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class BootstrapAdminInitializer implements ApplicationRunner {

    private final AdminUserRepository adminUserRepository;
    private final BootstrapSuperAdminProperties props;
    private final PasswordEncoder passwordEncoder;

    public BootstrapAdminInitializer(
            AdminUserRepository adminUserRepository,
            BootstrapSuperAdminProperties props,
            PasswordEncoder passwordEncoder
    ) {
        this.adminUserRepository = adminUserRepository;
        this.props = props;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (adminUserRepository.count() > 0) return;

        String username = props.username() == null || props.username().isBlank() ? "superadmin" : props.username().trim();
        String password = props.password() == null || props.password().isBlank() ? "Super@123" : props.password();

        AdminUser user = new AdminUser();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(Role.SUPER_ADMIN.name());
        user.setSchoolId(null);
        user.setActive(true);
        adminUserRepository.save(user);
    }
}

