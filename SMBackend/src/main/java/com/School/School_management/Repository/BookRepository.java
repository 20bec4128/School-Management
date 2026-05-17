package com.School.School_management.Repository;

import com.School.School_management.Entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookRepository extends JpaRepository<Book, Long> {

    @Query(value = """
            SELECT *
            FROM books b
            WHERE (:headOfficeId IS NULL OR b.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR b.school_id = :schoolId)
              AND (:language IS NULL OR LOWER(COALESCE(b.language, '')) = LOWER(:language))
              AND (:edition IS NULL OR LOWER(COALESCE(b.edition, '')) = LOWER(:edition))
              AND (:almiraNo IS NULL OR LOWER(COALESCE(b.almira_no, '')) = LOWER(:almiraNo))
              AND (
                    :search IS NULL
                    OR LOWER(COALESCE(b.title, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(b.book_id, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(b.isbn_no, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(b.author, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(b.edition, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(b.almira_no, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            ORDER BY b.id DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM books b
            WHERE (:headOfficeId IS NULL OR b.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR b.school_id = :schoolId)
              AND (:language IS NULL OR LOWER(COALESCE(b.language, '')) = LOWER(:language))
              AND (:edition IS NULL OR LOWER(COALESCE(b.edition, '')) = LOWER(:edition))
              AND (:almiraNo IS NULL OR LOWER(COALESCE(b.almira_no, '')) = LOWER(:almiraNo))
              AND (
                    :search IS NULL
                    OR LOWER(COALESCE(b.title, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(b.book_id, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(b.isbn_no, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(b.author, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(b.edition, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(b.almira_no, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """,
            nativeQuery = true)
    Page<Book> searchBooks(
            @Param("headOfficeId") Long headOfficeId,
            @Param("schoolId") Long schoolId,
            @Param("language") String language,
            @Param("edition") String edition,
            @Param("almiraNo") String almiraNo,
            @Param("search") String search,
            Pageable pageable
    );
}
