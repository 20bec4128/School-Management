package com.School.School_management.Repository;

import com.School.School_management.Entity.Guardian;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GuardianRepository extends JpaRepository<Guardian, Long> {

    @Query(
            value = """
                    select g.*
                    from guardians g
                    join schools s on s.id = g.school_id
                    where (:headOfficeId is null or s.head_office_id = :headOfficeId)
                      and (:schoolId is null or g.school_id = :schoolId)
                      and (:profession is null or lower(cast(g.profession as text)) = lower(cast(:profession as text)))
                      and (
                        :search is null
                        or lower(cast(coalesce(s.school_name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(g.name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(g.phone, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(g.profession, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(g.email, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                      )
                    """,
            countQuery = """
                    select count(*)
                    from guardians g
                    join schools s on s.id = g.school_id
                    where (:headOfficeId is null or s.head_office_id = :headOfficeId)
                      and (:schoolId is null or g.school_id = :schoolId)
                      and (:profession is null or lower(cast(g.profession as text)) = lower(cast(:profession as text)))
                      and (
                        :search is null
                        or lower(cast(coalesce(s.school_name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(g.name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(g.phone, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(g.profession, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(g.email, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                      )
                    """,
            nativeQuery = true)
    Page<Guardian> searchGuardians(
            @Param("headOfficeId") Long headOfficeId,
            @Param("schoolId") Long schoolId,
            @Param("profession") String profession,
            @Param("search") String search,
            Pageable pageable);
}

