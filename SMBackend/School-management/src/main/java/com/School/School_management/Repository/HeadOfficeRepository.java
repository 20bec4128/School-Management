package com.School.School_management.Repository;

import com.School.School_management.Entity.HeadOffice;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HeadOfficeRepository extends JpaRepository<HeadOffice, Long> {
    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    Optional<HeadOffice> findById(Long id);
}
