package com.School.School_management.Repository;

import com.School.School_management.Entity.Candidate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, Long> {

    @Query(
            value = """
                    select c.*
                    from candidates c
                    join schools s on s.id = c.school_id
                    join classes sc on sc.id = c.class_id
                    join sections ss on ss.id = c.section_id
                    join students st on st.id = c.student_id
                    where (:headOfficeId is null or s.head_office_id = :headOfficeId)
                      and (:schoolId is null or c.school_id = :schoolId)
                      and (:classId is null or c.class_id = :classId)
                      and (:sectionId is null or c.section_id = :sectionId)
                      and (:academicYear is null or lower(cast(c.academic_year as text)) like lower(concat('%', cast(:academicYear as text), '%')))
                      and (
                        :search is null
                        or lower(cast(c.academic_year as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(c.note, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(s.school_name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(sc.class_name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(ss.name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(st.name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                      )
                    """,
            countQuery = """
                    select count(*)
                    from candidates c
                    join schools s on s.id = c.school_id
                    join classes sc on sc.id = c.class_id
                    join sections ss on ss.id = c.section_id
                    join students st on st.id = c.student_id
                    where (:headOfficeId is null or s.head_office_id = :headOfficeId)
                      and (:schoolId is null or c.school_id = :schoolId)
                      and (:classId is null or c.class_id = :classId)
                      and (:sectionId is null or c.section_id = :sectionId)
                      and (:academicYear is null or lower(cast(c.academic_year as text)) like lower(concat('%', cast(:academicYear as text), '%')))
                      and (
                        :search is null
                        or lower(cast(c.academic_year as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(c.note, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(s.school_name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(sc.class_name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(ss.name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                        or lower(cast(coalesce(st.name, '') as text)) like lower(concat('%', cast(:search as text), '%'))
                      )
                    """,
            nativeQuery = true)
    Page<Candidate> searchCandidates(
            @Param("headOfficeId") Long headOfficeId,
            @Param("schoolId") Long schoolId,
            @Param("classId") Long classId,
            @Param("sectionId") Long sectionId,
            @Param("academicYear") String academicYear,
            @Param("search") String search,
            Pageable pageable);

    boolean existsBySchool_IdAndSchoolClass_IdAndSchoolSection_IdAndStudent_IdAndAcademicYearIgnoreCase(
            Long schoolId,
            Long classId,
            Long sectionId,
            Long studentId,
            String academicYear);

    boolean existsBySchool_IdAndSchoolClass_IdAndSchoolSection_IdAndStudent_IdAndAcademicYearIgnoreCaseAndIdNot(
            Long schoolId,
            Long classId,
            Long sectionId,
            Long studentId,
            String academicYear,
            Long id);
}
