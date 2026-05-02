package com.School.School_management.Repository;

import com.School.School_management.Entity.Parent;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParentRepository extends JpaRepository<Parent, Long> {
    Optional<Parent> findByUsername(String username);
}

