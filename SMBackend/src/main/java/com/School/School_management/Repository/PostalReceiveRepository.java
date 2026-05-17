package com.School.School_management.Repository;

import com.School.School_management.Entity.PostalReceive;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostalReceiveRepository extends JpaRepository<PostalReceive, Long> {
    List<PostalReceive> findBySchoolIdAndIsDeletedFalse(Long schoolId);

    @Query(value = """
            select p from PostalReceive p
            where p.schoolId = :schoolId
              and p.isDeleted = false
              and (
                :search is null
                or lower(p.fromTitle) like lower(concat('%', :search, '%'))
                or lower(coalesce(p.toTitle, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(p.referenceNo, '')) like lower(concat('%', :search, '%'))
              )
            order by p.date desc, p.id desc
            """,
            countQuery = """
            select count(p) from PostalReceive p
            where p.schoolId = :schoolId
              and p.isDeleted = false
              and (
                :search is null
                or lower(p.fromTitle) like lower(concat('%', :search, '%'))
                or lower(coalesce(p.toTitle, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(p.referenceNo, '')) like lower(concat('%', :search, '%'))
              )
            """
    )
    Page<PostalReceive> searchBySchoolId(@Param("schoolId") Long schoolId, @Param("search") String search, Pageable pageable);
}
