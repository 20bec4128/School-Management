package com.School.School_management.Repository;

import com.School.School_management.Entity.GalleryVideo;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GalleryVideoRepository extends JpaRepository<GalleryVideo, Long> {
    List<GalleryVideo> findAllByIsDeletedFalseOrderByIdDesc();
    List<GalleryVideo> findBySchoolIdAndIsDeletedFalseOrderByIdDesc(Long schoolId);
}
