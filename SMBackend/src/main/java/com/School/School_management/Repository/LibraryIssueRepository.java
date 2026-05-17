package com.School.School_management.Repository;

import com.School.School_management.Entity.LibraryIssue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LibraryIssueRepository extends JpaRepository<LibraryIssue, Long> {

    @Query(value = """
            SELECT li.*
            FROM library_issues li
            LEFT JOIN schools sch ON sch.id = li.school_id
            LEFT JOIN books b ON b.id = li.book_id
            LEFT JOIN classes cls ON cls.id = li.class_id
            LEFT JOIN students s ON s.id = li.student_id
            LEFT JOIN employees e ON e.id = li.employee_id
            WHERE (:headOfficeId IS NULL OR li.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR li.school_id = :schoolId)
              AND (:status IS NULL OR LOWER(COALESCE(li.status, '')) = LOWER(:status))
              AND (
                    :search IS NULL
                    OR LOWER(COALESCE(li.book_title, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(CAST(li.book_id AS TEXT), '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(li.borrower_type, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(li.class_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(li.student_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(li.employee_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(li.employee_role, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(li.note, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(sch.school_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(cls.class_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(e.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(b.title, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            ORDER BY li.id DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM library_issues li
            LEFT JOIN schools sch ON sch.id = li.school_id
            LEFT JOIN books b ON b.id = li.book_id
            LEFT JOIN classes cls ON cls.id = li.class_id
            LEFT JOIN students s ON s.id = li.student_id
            LEFT JOIN employees e ON e.id = li.employee_id
            WHERE (:headOfficeId IS NULL OR li.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR li.school_id = :schoolId)
              AND (:status IS NULL OR LOWER(COALESCE(li.status, '')) = LOWER(:status))
              AND (
                    :search IS NULL
                    OR LOWER(COALESCE(li.book_title, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(CAST(li.book_id AS TEXT), '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(li.borrower_type, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(li.class_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(li.student_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(li.employee_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(li.employee_role, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(li.note, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(sch.school_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(cls.class_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(e.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(b.title, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """,
            nativeQuery = true)
    Page<LibraryIssue> searchLibraryIssues(
            @Param("headOfficeId") Long headOfficeId,
            @Param("schoolId") Long schoolId,
            @Param("status") String status,
            @Param("search") String search,
            Pageable pageable
    );
}
