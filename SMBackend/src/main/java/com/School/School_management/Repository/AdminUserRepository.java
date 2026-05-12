package com.School.School_management.Repository;

import com.School.School_management.Entity.AdminUser;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminUserRepository extends JpaRepository<AdminUser, Long> {
    Optional<AdminUser> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByHeadOfficeId(Long headOfficeId);

    List<AdminUser> findAllByHeadOfficeId(Long headOfficeId);

    Optional<AdminUser> findFirstByHeadOfficeIdAndSchoolIdIsNullOrderByIdAsc(Long headOfficeId);

    Optional<AdminUser> findFirstBySchoolIdAndRoleOrderByIdAsc(Long schoolId, String role);

    boolean existsByUsernameAndIdNot(String username, Long id);
}
