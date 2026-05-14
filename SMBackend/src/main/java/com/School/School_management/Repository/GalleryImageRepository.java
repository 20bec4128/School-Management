package com.School.School_management.Repository;

import com.School.School_management.Entity.GalleryImage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GalleryImageRepository extends JpaRepository<GalleryImage, Long> {
    List<GalleryImage> findAllByIsDeletedFalseOrderByIdDesc();
    List<GalleryImage> findBySchoolIdAndIsDeletedFalseOrderByIdDesc(Long schoolId);
}
