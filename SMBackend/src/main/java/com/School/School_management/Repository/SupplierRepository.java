package com.School.School_management.Repository;

import com.School.School_management.Entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    @Query(value = """
            SELECT *
            FROM suppliers s
            WHERE (:headOfficeId IS NULL OR s.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR s.school_id = :schoolId)
              AND (
                    :search IS NULL
                    OR LOWER(
                        CASE
                            WHEN pg_typeof(s.supplier_name) = 'bytea'::regtype
                                THEN convert_from(s.supplier_name::bytea, 'UTF8')
                            ELSE s.supplier_name::text
                        END
                    ) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(
                        CASE
                            WHEN pg_typeof(s.contact_name) = 'bytea'::regtype
                                THEN convert_from(s.contact_name::bytea, 'UTF8')
                            ELSE s.contact_name::text
                        END
                    ) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            ORDER BY s.id DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM suppliers s
            WHERE (:headOfficeId IS NULL OR s.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR s.school_id = :schoolId)
              AND (
                    :search IS NULL
                    OR LOWER(
                        CASE
                            WHEN pg_typeof(s.supplier_name) = 'bytea'::regtype
                                THEN convert_from(s.supplier_name::bytea, 'UTF8')
                            ELSE s.supplier_name::text
                        END
                    ) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(
                        CASE
                            WHEN pg_typeof(s.contact_name) = 'bytea'::regtype
                                THEN convert_from(s.contact_name::bytea, 'UTF8')
                            ELSE s.contact_name::text
                        END
                    ) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """,
            nativeQuery = true)
    Page<Supplier> searchSuppliers(
            @Param("headOfficeId") Long headOfficeId,
            @Param("schoolId") Long schoolId,
            @Param("search") String search,
            Pageable pageable
    );
}
