package com.School.School_management.Repository;

import com.School.School_management.Entity.EBook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EBookRepository extends JpaRepository<EBook, Long> {

    @Query(value = """
            SELECT *
            FROM ebooks e
            WHERE (:headOfficeId IS NULL OR e.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR e.school_id = :schoolId)
              AND (:ebookType IS NULL OR LOWER(COALESCE(e.ebook_type, '')) = LOWER(:ebookType))
              AND (:classId IS NULL OR e.class_id = :classId)
              AND (:language IS NULL OR LOWER(COALESCE(e.language, '')) = LOWER(:language))
              AND (
                    :search IS NULL
                    OR LOWER(COALESCE(e.ebook_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(e.author, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(e.edition, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(e.file_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            ORDER BY e.id DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM ebooks e
            WHERE (:headOfficeId IS NULL OR e.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR e.school_id = :schoolId)
              AND (:ebookType IS NULL OR LOWER(COALESCE(e.ebook_type, '')) = LOWER(:ebookType))
              AND (:classId IS NULL OR e.class_id = :classId)
              AND (:language IS NULL OR LOWER(COALESCE(e.language, '')) = LOWER(:language))
              AND (
                    :search IS NULL
                    OR LOWER(COALESCE(e.ebook_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(e.author, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(e.edition, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(e.file_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """,
            nativeQuery = true)
    Page<EBook> searchEBooks(
            @Param("headOfficeId") Long headOfficeId,
            @Param("schoolId") Long schoolId,
            @Param("ebookType") String ebookType,
            @Param("classId") Long classId,
            @Param("language") String language,
            @Param("search") String search,
            Pageable pageable
    );
}
