package com.School.School_management.Repository;

import com.School.School_management.Entity.Purchase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    @Query(value = """
            SELECT p.*
            FROM purchases p
            LEFT JOIN schools s ON s.id = p.school_id
            LEFT JOIN head_offices h ON h.id = p.head_office_id
            LEFT JOIN suppliers sup ON sup.id = p.supplier_id
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN products pr ON pr.id = p.product_id
            LEFT JOIN employees e ON e.id = p.purchase_by_id
            WHERE (:headOfficeId IS NULL OR p.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR p.school_id = :schoolId)
              AND (:supplierId IS NULL OR p.supplier_id = :supplierId)
              AND (:categoryId IS NULL OR p.category_id = :categoryId)
              AND (:productId IS NULL OR p.product_id = :productId)
              AND (
                    :search IS NULL
                    OR LOWER(COALESCE(sup.supplier_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(c.category_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(pr.product_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(pr.product_code, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(p.purchase_by_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(p.unit_type, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(p.custom_unit_type, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(p.note, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.school_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(h.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(e.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            ORDER BY p.id DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM purchases p
            LEFT JOIN schools s ON s.id = p.school_id
            LEFT JOIN head_offices h ON h.id = p.head_office_id
            LEFT JOIN suppliers sup ON sup.id = p.supplier_id
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN products pr ON pr.id = p.product_id
            LEFT JOIN employees e ON e.id = p.purchase_by_id
            WHERE (:headOfficeId IS NULL OR p.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR p.school_id = :schoolId)
              AND (:supplierId IS NULL OR p.supplier_id = :supplierId)
              AND (:categoryId IS NULL OR p.category_id = :categoryId)
              AND (:productId IS NULL OR p.product_id = :productId)
              AND (
                    :search IS NULL
                    OR LOWER(COALESCE(sup.supplier_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(c.category_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(pr.product_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(pr.product_code, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(p.purchase_by_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(p.unit_type, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(p.custom_unit_type, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(p.note, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.school_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(h.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(e.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """,
            nativeQuery = true)
    Page<Purchase> searchPurchases(
            @Param("headOfficeId") Long headOfficeId,
            @Param("schoolId") Long schoolId,
            @Param("supplierId") Long supplierId,
            @Param("categoryId") Long categoryId,
            @Param("productId") Long productId,
            @Param("search") String search,
            Pageable pageable
    );
}
