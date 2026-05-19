package com.School.School_management.Repository;

import com.School.School_management.Entity.Complain;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ComplainRepository extends JpaRepository<Complain, Long> {
    List<Complain> findBySchoolIdAndIsDeletedFalse(Long schoolId);

    @Query(value = """
            select c from Complain c
              left join c.complainType t
              left join c.student st
              left join c.teacher te
            where c.schoolId = :schoolId
              and c.isDeleted = false
              and (:academicYear is null or c.academicYear = :academicYear)
              and (:userType is null or c.userType = :userType)
              and (:complainTypeId is null or t.id = :complainTypeId)
              and (
                :search is null
                or lower(c.complainBy) like lower(concat('%', :search, '%'))
                or lower(coalesce(st.name, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(te.name, '')) like lower(concat('%', :search, '%'))
                or lower(c.academicYear) like lower(concat('%', :search, '%'))
                or lower(c.userType) like lower(concat('%', :search, '%'))
                or lower(coalesce(t.complainType, '')) like lower(concat('%', :search, '%'))
              )
            order by c.complainDate desc, c.id desc
            """,
            countQuery = """
            select count(c) from Complain c
              left join c.complainType t
              left join c.student st
              left join c.teacher te
            where c.schoolId = :schoolId
              and c.isDeleted = false
              and (:academicYear is null or c.academicYear = :academicYear)
              and (:userType is null or c.userType = :userType)
              and (:complainTypeId is null or t.id = :complainTypeId)
              and (
                :search is null
                or lower(c.complainBy) like lower(concat('%', :search, '%'))
                or lower(coalesce(st.name, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(te.name, '')) like lower(concat('%', :search, '%'))
                or lower(c.academicYear) like lower(concat('%', :search, '%'))
                or lower(c.userType) like lower(concat('%', :search, '%'))
                or lower(coalesce(t.complainType, '')) like lower(concat('%', :search, '%'))
              )
            """
    )
    Page<Complain> searchBySchoolId(
            @Param("schoolId") Long schoolId,
            @Param("search") String search,
            @Param("academicYear") String academicYear,
            @Param("complainTypeId") Long complainTypeId,
            @Param("userType") String userType,
            Pageable pageable
    );
}
