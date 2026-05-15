package com.School.School_management.Repository;

import com.School.School_management.Entity.Warehouse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {

    @Query(value = """
            SELECT w.*
            FROM warehouses w
            LEFT JOIN schools s ON s.id = w.school_id
            LEFT JOIN head_offices h ON h.id = w.head_office_id
            WHERE (:headOfficeId IS NULL OR w.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR w.school_id = :schoolId)
              AND (
                    :search IS NULL
                    OR LOWER(COALESCE(w.warehouse_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(w.warehouse_keeper, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(w.email, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(w.phone, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(w.address, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(w.note, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.school_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(h.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            ORDER BY w.id DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM warehouses w
            LEFT JOIN schools s ON s.id = w.school_id
            LEFT JOIN head_offices h ON h.id = w.head_office_id
            WHERE (:headOfficeId IS NULL OR w.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR w.school_id = :schoolId)
              AND (
                    :search IS NULL
                    OR LOWER(COALESCE(w.warehouse_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(w.warehouse_keeper, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(w.email, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(w.phone, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(w.address, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(w.note, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.school_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(h.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """,
            nativeQuery = true)
    Page<Warehouse> searchWarehouses(
            @Param("headOfficeId") Long headOfficeId,
            @Param("schoolId") Long schoolId,
            @Param("search") String search,
            Pageable pageable
    );
}
