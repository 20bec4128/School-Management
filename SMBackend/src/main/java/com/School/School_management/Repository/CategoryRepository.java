package com.School.School_management.Repository;

import com.School.School_management.Entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    @Query(value = """
            SELECT c.*
            FROM categories c
            LEFT JOIN schools s ON s.id = c.school_id
            LEFT JOIN head_offices h ON h.id = c.head_office_id
            WHERE (:headOfficeId IS NULL OR c.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR c.school_id = :schoolId)
              AND (
                    :search IS NULL
                    OR LOWER(COALESCE(c.category_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(c.note, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.school_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(h.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            ORDER BY c.id DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM categories c
            LEFT JOIN schools s ON s.id = c.school_id
            LEFT JOIN head_offices h ON h.id = c.head_office_id
            WHERE (:headOfficeId IS NULL OR c.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR c.school_id = :schoolId)
              AND (
                    :search IS NULL
                    OR LOWER(COALESCE(c.category_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(c.note, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.school_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(h.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """,
            nativeQuery = true)
    Page<Category> searchCategories(
            @Param("headOfficeId") Long headOfficeId,
            @Param("schoolId") Long schoolId,
            @Param("search") String search,
            Pageable pageable
    );
}
