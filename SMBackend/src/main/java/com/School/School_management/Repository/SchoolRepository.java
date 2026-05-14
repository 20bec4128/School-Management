package com.School.School_management.Repository;

import com.School.School_management.Entity.ManageSchool;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SchoolRepository extends JpaRepository<ManageSchool, Long> {
    Optional<ManageSchool> findByIdAndIsDeletedFalse(Long id);

    Optional<ManageSchool> findByIdAndIsDeletedFalseAndHeadOfficeId(Long id, Long headOfficeId);

    Optional<ManageSchool> findBySchoolUrlAndIsDeletedFalse(String schoolUrl);

    List<ManageSchool> findAllByIsDeletedFalse();

    List<ManageSchool> findAllByIsDeletedFalseAndHeadOfficeId(Long headOfficeId);

    boolean existsByIsDeletedFalseAndHeadOfficeId(Long headOfficeId);

    Page<ManageSchool> findAllByIsDeletedFalseAndHeadOfficeId(Long headOfficeId, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT s FROM ManageSchool s WHERE s.isDeleted = false " +
            "AND (:headOfficeId IS NULL OR s.headOfficeId = :headOfficeId) " +
            "AND (:status IS NULL OR s.status = :status) " +
            "AND (:search IS NULL OR LOWER(s.schoolName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(s.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(s.phone) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<ManageSchool> searchSchools(
            @org.springframework.data.repository.query.Param("headOfficeId") Long headOfficeId,
            @org.springframework.data.repository.query.Param("status") String status,
            @org.springframework.data.repository.query.Param("search") String search,
            Pageable pageable);
}
