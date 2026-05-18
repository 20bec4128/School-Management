package com.School.School_management.Repository;

import com.School.School_management.Entity.SuperAdmin;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SuperAdminRepository extends JpaRepository<SuperAdmin, Long>, JpaSpecificationExecutor<SuperAdmin> {

    Optional<SuperAdmin> findByUsername(String username);
}
