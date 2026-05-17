package com.School.School_management.Repository;

import com.School.School_management.Entity.Gallery;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GalleryRepository extends JpaRepository<Gallery, Long> {
    List<Gallery> findAllByIsDeletedFalseOrderByIdDesc();
    List<Gallery> findBySchoolIdAndIsDeletedFalseOrderByIdDesc(Long schoolId);

    @Query(value = """
            select g from Gallery g
            where g.schoolId = :schoolId
              and g.isDeleted = false
              and (:isViewOnWeb is null or g.isViewOnWeb = :isViewOnWeb)
              and (
                :search is null
                or lower(coalesce(g.title, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(g.note, '')) like lower(concat('%', :search, '%'))
              )
            order by g.id desc
            """,
            countQuery = """
            select count(g) from Gallery g
            where g.schoolId = :schoolId
              and g.isDeleted = false
              and (:isViewOnWeb is null or g.isViewOnWeb = :isViewOnWeb)
              and (
                :search is null
                or lower(coalesce(g.title, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(g.note, '')) like lower(concat('%', :search, '%'))
              )
            """)
    Page<Gallery> pageBySchoolId(
            @Param("schoolId") Long schoolId,
            @Param("search") String search,
            @Param("isViewOnWeb") Boolean isViewOnWeb,
            Pageable pageable);
}
