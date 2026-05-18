package com.School.School_management.Repository;

import com.School.School_management.Entity.CertificateType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CertificateTypeRepository extends JpaRepository<CertificateType, Long> {

    @Query(value = """
            SELECT ct.*
            FROM certificate_types ct
            LEFT JOIN schools s ON s.id = ct.school_id
            LEFT JOIN head_offices h ON h.id = ct.head_office_id
            WHERE (:headOfficeId IS NULL OR ct.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR ct.school_id = :schoolId)
              AND (
                    :search IS NULL
                    OR LOWER(COALESCE(ct.certificate_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(ct.school_name_on_card, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(ct.certificate_text, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(ct.footer_left_text, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(ct.footer_middle_text, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(ct.footer_right_text, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.school_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(h.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            ORDER BY ct.id DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM certificate_types ct
            LEFT JOIN schools s ON s.id = ct.school_id
            LEFT JOIN head_offices h ON h.id = ct.head_office_id
            WHERE (:headOfficeId IS NULL OR ct.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR ct.school_id = :schoolId)
              AND (
                    :search IS NULL
                    OR LOWER(COALESCE(ct.certificate_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(ct.school_name_on_card, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(ct.certificate_text, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(ct.footer_left_text, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(ct.footer_middle_text, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(ct.footer_right_text, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.school_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(h.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """,
            nativeQuery = true)
    Page<CertificateType> searchCertificateTypes(
            @Param("headOfficeId") Long headOfficeId,
            @Param("schoolId") Long schoolId,
            @Param("search") String search,
            Pageable pageable
    );

    boolean existsBySchoolIdAndCertificateNameIgnoreCase(Long schoolId, String certificateName);

    boolean existsBySchoolIdAndCertificateNameIgnoreCaseAndIdNot(Long schoolId, String certificateName, Long id);
}
