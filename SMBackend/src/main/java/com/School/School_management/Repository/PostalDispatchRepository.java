package com.School.School_management.Repository;

import com.School.School_management.Entity.PostalDispatch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostalDispatchRepository extends JpaRepository<PostalDispatch, Long> {
    List<PostalDispatch> findBySchoolIdAndIsDeletedFalse(Long schoolId);

    @Query(value = """
            select p from PostalDispatch p
            where p.schoolId = :schoolId
              and p.isDeleted = false
              and (
                :search is null
                or lower(p.toTitle) like lower(concat('%', :search, '%'))
                or lower(coalesce(p.fromTitle, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(p.referenceNo, '')) like lower(concat('%', :search, '%'))
              )
            order by p.date desc, p.id desc
            """,
            countQuery = """
            select count(p) from PostalDispatch p
            where p.schoolId = :schoolId
              and p.isDeleted = false
              and (
                :search is null
                or lower(p.toTitle) like lower(concat('%', :search, '%'))
                or lower(coalesce(p.fromTitle, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(p.referenceNo, '')) like lower(concat('%', :search, '%'))
              )
            """
    )
    Page<PostalDispatch> searchBySchoolId(@Param("schoolId") Long schoolId, @Param("search") String search, Pageable pageable);
}
