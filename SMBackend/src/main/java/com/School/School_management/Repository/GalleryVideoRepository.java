package com.School.School_management.Repository;

import com.School.School_management.Entity.GalleryVideo;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GalleryVideoRepository extends JpaRepository<GalleryVideo, Long> {
    List<GalleryVideo> findAllByIsDeletedFalseOrderByIdDesc();
    List<GalleryVideo> findBySchoolIdAndIsDeletedFalseOrderByIdDesc(Long schoolId);

    @Query(value = """
            select g from GalleryVideo g
            where g.schoolId = :schoolId
              and g.isDeleted = false
              and (:galleryId is null or g.galleryId = :galleryId)
              and (
                :search is null
                or lower(coalesce(g.title, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(g.caption, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(g.videoPath, '')) like lower(concat('%', :search, '%'))
              )
            order by g.id desc
            """,
            countQuery = """
            select count(g) from GalleryVideo g
            where g.schoolId = :schoolId
              and g.isDeleted = false
              and (:galleryId is null or g.galleryId = :galleryId)
              and (
                :search is null
                or lower(coalesce(g.title, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(g.caption, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(g.videoPath, '')) like lower(concat('%', :search, '%'))
              )
            """)
    Page<GalleryVideo> pageBySchoolId(
            @Param("schoolId") Long schoolId,
            @Param("galleryId") Long galleryId,
            @Param("search") String search,
            Pageable pageable);
}
