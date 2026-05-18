package com.School.School_management.Repository;

import com.School.School_management.Entity.Donor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DonorRepository extends JpaRepository<Donor, Long> {

    @Query(
            value = """
                    select d.*
                    from donors d
                    join schools s on s.id = d.school_id
                    where (:headOfficeId is null or s.head_office_id = :headOfficeId)
                      and (:schoolId is null or d.school_id = :schoolId)
                      and (:donorType is null or lower(cast(d.donor_type as text)) = lower(cast(:donorType as text)))
                      and (:academicYear is null or lower(cast(d.academic_year as text)) like lower(concat('%', cast(:academicYear as text), '%')))
                      and (
                        :search is null
                        or lower(cast(coalesce(d.academic_year, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(d.donor_type, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(d.donor_name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(d.contact_name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(d.email, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(d.phone, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(d.note, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(s.school_name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                      )
                    """,
            countQuery = """
                    select count(*)
                    from donors d
                    join schools s on s.id = d.school_id
                    where (:headOfficeId is null or s.head_office_id = :headOfficeId)
                      and (:schoolId is null or d.school_id = :schoolId)
                      and (:donorType is null or lower(cast(d.donor_type as text)) = lower(cast(:donorType as text)))
                      and (:academicYear is null or lower(cast(d.academic_year as text)) like lower(concat('%', cast(:academicYear as text), '%')))
                      and (
                        :search is null
                        or lower(cast(coalesce(d.academic_year, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(d.donor_type, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(d.donor_name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(d.contact_name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(d.email, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(d.phone, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(d.note, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(s.school_name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                      )
                    """,
            nativeQuery = true)
    Page<Donor> searchDonors(
            @Param("headOfficeId") Long headOfficeId,
            @Param("schoolId") Long schoolId,
            @Param("donorType") String donorType,
            @Param("academicYear") String academicYear,
            @Param("search") String search,
            Pageable pageable);
}

