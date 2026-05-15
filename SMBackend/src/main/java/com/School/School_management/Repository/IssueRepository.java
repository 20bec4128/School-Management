package com.School.School_management.Repository;

import com.School.School_management.Entity.Issue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IssueRepository extends JpaRepository<Issue, Long> {

    @Query(value = """
            SELECT i.*
            FROM issues i
            LEFT JOIN schools sch ON sch.id = i.school_id
            LEFT JOIN head_offices ho ON ho.id = i.head_office_id
            LEFT JOIN categories c ON c.id = i.category_id
            LEFT JOIN products p ON p.id = i.product_id
            WHERE (:headOfficeId IS NULL OR i.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR i.school_id = :schoolId)
              AND (:userType IS NULL OR LOWER(COALESCE(i.user_type, '')) = LOWER(:userType))
              AND (
                    :search IS NULL
                    OR LOWER(COALESCE(i.issue_to_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(i.user_type, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(i.note, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(sch.school_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(ho.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(c.category_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(p.product_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            ORDER BY i.id DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM issues i
            LEFT JOIN schools sch ON sch.id = i.school_id
            LEFT JOIN head_offices ho ON ho.id = i.head_office_id
            LEFT JOIN categories c ON c.id = i.category_id
            LEFT JOIN products p ON p.id = i.product_id
            WHERE (:headOfficeId IS NULL OR i.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR i.school_id = :schoolId)
              AND (:userType IS NULL OR LOWER(COALESCE(i.user_type, '')) = LOWER(:userType))
              AND (
                    :search IS NULL
                    OR LOWER(COALESCE(i.issue_to_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(i.user_type, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(i.note, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(sch.school_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(ho.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(c.category_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(p.product_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """,
            nativeQuery = true)
    Page<Issue> searchIssues(
            @Param("headOfficeId") Long headOfficeId,
            @Param("schoolId") Long schoolId,
            @Param("userType") String userType,
            @Param("search") String search,
            Pageable pageable
    );
}
