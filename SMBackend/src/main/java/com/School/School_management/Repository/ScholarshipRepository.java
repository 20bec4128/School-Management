package com.School.School_management.Repository;

import com.School.School_management.Entity.Scholarship;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ScholarshipRepository extends JpaRepository<Scholarship, Long> {

    @Query(
            value = """
                    select sc.*
                    from scholarships sc
                    join schools s on s.id = sc.school_id
                    join classes c on c.id = sc.class_id
                    join sections ss on ss.id = sc.section_id
                    join students st on st.id = sc.student_id
                    where (:headOfficeId is null or s.head_office_id = :headOfficeId)
                      and (:schoolId is null or sc.school_id = :schoolId)
                      and (:classId is null or sc.class_id = :classId)
                      and (:sectionId is null or sc.section_id = :sectionId)
                      and (
                        :search is null
                        or lower(cast(coalesce(s.school_name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(st.name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(st.roll_no, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(c.class_name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(ss.name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(sc.note, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                      )
                    """,
            countQuery = """
                    select count(*)
                    from scholarships sc
                    join schools s on s.id = sc.school_id
                    join classes c on c.id = sc.class_id
                    join sections ss on ss.id = sc.section_id
                    join students st on st.id = sc.student_id
                    where (:headOfficeId is null or s.head_office_id = :headOfficeId)
                      and (:schoolId is null or sc.school_id = :schoolId)
                      and (:classId is null or sc.class_id = :classId)
                      and (:sectionId is null or sc.section_id = :sectionId)
                      and (
                        :search is null
                        or lower(cast(coalesce(s.school_name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(st.name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(st.roll_no, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(c.class_name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(ss.name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(sc.note, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                      )
                    """,
            nativeQuery = true)
    Page<Scholarship> searchScholarships(
            @Param("headOfficeId") Long headOfficeId,
            @Param("schoolId") Long schoolId,
            @Param("classId") Long classId,
            @Param("sectionId") Long sectionId,
            @Param("search") String search,
            Pageable pageable);
}

