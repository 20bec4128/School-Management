package com.School.School_management.Repository;

import com.School.School_management.Entity.VisitorInfo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VisitorInfoRepository extends JpaRepository<VisitorInfo, Long> {
    List<VisitorInfo> findBySchoolIdAndIsDeletedFalse(Long schoolId);

    @Query(value = """
            select v from VisitorInfo v
              left join v.purpose p
            where v.schoolId = :schoolId
              and v.isDeleted = false
              and (
                :search is null
                or lower(v.name) like lower(concat('%', :search, '%'))
                or lower(coalesce(v.phone, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(v.comingFrom, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(v.idCard, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(p.purpose, '')) like lower(concat('%', :search, '%'))
              )
            order by v.date desc, v.id desc
            """,
            countQuery = """
            select count(v) from VisitorInfo v
              left join v.purpose p
            where v.schoolId = :schoolId
              and v.isDeleted = false
              and (
                :search is null
                or lower(v.name) like lower(concat('%', :search, '%'))
                or lower(coalesce(v.phone, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(v.comingFrom, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(v.idCard, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(p.purpose, '')) like lower(concat('%', :search, '%'))
              )
            """
    )
    Page<VisitorInfo> searchBySchoolId(@Param("schoolId") Long schoolId, @Param("search") String search, Pageable pageable);
}
