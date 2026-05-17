package com.School.School_management.Repository;

import com.School.School_management.Entity.IdCardSetting;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IdCardSettingRepository extends JpaRepository<IdCardSetting, Long> {

    @Query(value = """
            SELECT s.*
            FROM id_card_settings s
            LEFT JOIN schools sch ON sch.id = s.school_id
            LEFT JOIN head_offices ho ON ho.id = s.head_office_id
            WHERE (:headOfficeId IS NULL OR s.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR s.school_id = :schoolId)
              AND (
                    :search IS NULL
                    OR LOWER(COALESCE(s.border_color, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.top_background, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.card_school_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.school_address, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.bottom_signature, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.signature_background, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.signature_align, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(sch.school_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(ho.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            ORDER BY s.id DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM id_card_settings s
            LEFT JOIN schools sch ON sch.id = s.school_id
            LEFT JOIN head_offices ho ON ho.id = s.head_office_id
            WHERE (:headOfficeId IS NULL OR s.head_office_id = :headOfficeId)
              AND (:schoolId IS NULL OR s.school_id = :schoolId)
              AND (
                    :search IS NULL
                    OR LOWER(COALESCE(s.border_color, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.top_background, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.card_school_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.school_address, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.bottom_signature, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.signature_background, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.signature_align, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(sch.school_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(ho.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """,
            nativeQuery = true)
    Page<IdCardSetting> searchIdCardSettings(
            @Param("headOfficeId") Long headOfficeId,
            @Param("schoolId") Long schoolId,
            @Param("search") String search,
            Pageable pageable
    );
}
