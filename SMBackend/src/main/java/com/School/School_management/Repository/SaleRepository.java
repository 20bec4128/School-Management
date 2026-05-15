package com.School.School_management.Repository;

import com.School.School_management.Entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    @Query(value = """
            SELECT s.*
            FROM sales s
            LEFT JOIN schools sch ON sch.id = s.school_id
            LEFT JOIN head_offices ho ON ho.id = s.head_office_id
            LEFT JOIN income_heads ih ON ih.id = s.income_head_id
            WHERE (:headOfficeId IS NULL OR s.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR s.school_id = :schoolId)
              AND (:status IS NULL OR LOWER(COALESCE(s.status, '')) = LOWER(:status))
              AND (
                    :search IS NULL
                    OR LOWER(COALESCE(s.invoice_number, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.sale_to_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.user_type, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.status, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.note, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(sch.school_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(ho.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(ih.income_head, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            ORDER BY s.id DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM sales s
            LEFT JOIN schools sch ON sch.id = s.school_id
            LEFT JOIN head_offices ho ON ho.id = s.head_office_id
            LEFT JOIN income_heads ih ON ih.id = s.income_head_id
            WHERE (:headOfficeId IS NULL OR s.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR s.school_id = :schoolId)
              AND (:status IS NULL OR LOWER(COALESCE(s.status, '')) = LOWER(:status))
              AND (
                    :search IS NULL
                    OR LOWER(COALESCE(s.invoice_number, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.sale_to_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.user_type, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.status, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.note, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(sch.school_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(ho.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(ih.income_head, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """,
            nativeQuery = true)
    Page<Sale> searchSales(
            @Param("headOfficeId") Long headOfficeId,
            @Param("schoolId") Long schoolId,
            @Param("status") String status,
            @Param("search") String search,
            Pageable pageable
    );
}
