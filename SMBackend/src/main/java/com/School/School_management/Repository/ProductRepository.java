package com.School.School_management.Repository;

import com.School.School_management.Entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query(value = """
            SELECT p.*
            FROM products p
            LEFT JOIN schools s ON s.id = p.school_id
            LEFT JOIN head_offices h ON h.id = p.head_office_id
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN warehouses w ON w.id = p.warehouse_id
            WHERE (:headOfficeId IS NULL OR p.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR p.school_id = :schoolId)
              AND (:categoryId IS NULL OR p.category_id = :categoryId)
              AND (:warehouseId IS NULL OR p.warehouse_id = :warehouseId)
              AND (
                    :search IS NULL
                    OR LOWER(COALESCE(p.product_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(p.product_code, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(p.note, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.school_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(h.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(c.category_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(w.warehouse_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            ORDER BY p.id DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM products p
            LEFT JOIN schools s ON s.id = p.school_id
            LEFT JOIN head_offices h ON h.id = p.head_office_id
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN warehouses w ON w.id = p.warehouse_id
            WHERE (:headOfficeId IS NULL OR p.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR p.school_id = :schoolId)
              AND (:categoryId IS NULL OR p.category_id = :categoryId)
              AND (:warehouseId IS NULL OR p.warehouse_id = :warehouseId)
              AND (
                    :search IS NULL
                    OR LOWER(COALESCE(p.product_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(p.product_code, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(p.note, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.school_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(h.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(c.category_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(w.warehouse_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """,
            nativeQuery = true)
    Page<Product> searchProducts(
            @Param("headOfficeId") Long headOfficeId,
            @Param("schoolId") Long schoolId,
            @Param("categoryId") Long categoryId,
            @Param("warehouseId") Long warehouseId,
            @Param("search") String search,
            Pageable pageable
    );
}
