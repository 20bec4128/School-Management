package com.School.School_management.Repository;

import com.School.School_management.Entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    @Query("""
            SELECT s
            FROM Supplier s
            WHERE (:headOfficeId IS NULL OR s.headOfficeId = :headOfficeId)
              AND (:schoolId IS NULL OR s.schoolId = :schoolId)
              AND (
                    :search IS NULL
                    OR LOWER(s.supplierName) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(s.contactName) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.email, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.phone, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.address, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.note, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """)
    Page<Supplier> searchSuppliers(
            @Param("headOfficeId") Long headOfficeId,
            @Param("schoolId") Long schoolId,
            @Param("search") String search,
            Pageable pageable
    );
}
