package com.School.School_management.Repository;

import com.School.School_management.Entity.ManageSchool;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SchoolRepository extends JpaRepository<ManageSchool, Long> {
    Optional<ManageSchool> findByIdAndIsDeletedFalse(Long id);

    Optional<ManageSchool> findByIdAndIsDeletedFalseAndHeadOfficeId(Long id, Long headOfficeId);

    boolean existsByIsDeletedFalseAndHeadOfficeId(Long headOfficeId);

    Page<ManageSchool> findAllByIsDeletedFalseAndHeadOfficeId(Long headOfficeId, Pageable pageable);
}
