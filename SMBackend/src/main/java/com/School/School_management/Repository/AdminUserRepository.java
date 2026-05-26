package com.School.School_management.Repository;

import com.School.School_management.Entity.AdminUser;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdminUserRepository extends JpaRepository<AdminUser, Long> {
    Optional<AdminUser> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByHeadOfficeId(Long headOfficeId);

    List<AdminUser> findAllByHeadOfficeId(Long headOfficeId);

    Optional<AdminUser> findFirstByHeadOfficeIdAndSchoolIdIsNullOrderByIdAsc(Long headOfficeId);

    Optional<AdminUser> findFirstByHeadOfficeIdAndRoleOrderByIdAsc(Long headOfficeId, String role);

    Optional<AdminUser> findFirstBySchoolIdAndRoleOrderByIdAsc(Long schoolId, String role);

    List<AdminUser> findBySchoolIdAndRoleIgnoreCaseOrderByIdDesc(Long schoolId, String role);

    @Query("select distinct a.role from AdminUser a where a.schoolId = :schoolId and a.role is not null order by a.role")
    List<String> findDistinctRolesBySchoolId(@Param("schoolId") Long schoolId);

    boolean existsByUsernameAndIdNot(String username, Long id);
}
