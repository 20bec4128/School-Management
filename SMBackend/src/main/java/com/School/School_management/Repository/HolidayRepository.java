package com.School.School_management.Repository;

import com.School.School_management.Entity.Holiday;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, Long> {
    List<Holiday> findAllByIsDeletedFalseOrderByIdDesc();
    List<Holiday> findBySchoolIdAndIsDeletedFalseOrderByIdDesc(Long schoolId);

    @Query(value = """
            select h from Holiday h
            where h.schoolId = :schoolId
              and h.isDeleted = false
              and (:isViewOnWeb is null or h.isViewOnWeb = :isViewOnWeb)
              and (
                :search is null
                or lower(coalesce(h.title, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(h.note, '')) like lower(concat('%', :search, '%'))
              )
            order by h.id desc
            """,
            countQuery = """
            select count(h) from Holiday h
            where h.schoolId = :schoolId
              and h.isDeleted = false
              and (:isViewOnWeb is null or h.isViewOnWeb = :isViewOnWeb)
              and (
                :search is null
                or lower(coalesce(h.title, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(h.note, '')) like lower(concat('%', :search, '%'))
              )
            """)
    Page<Holiday> pageBySchoolId(
            @Param("schoolId") Long schoolId,
            @Param("search") String search,
            @Param("isViewOnWeb") Boolean isViewOnWeb,
            Pageable pageable);
}
