package com.School.School_management.Repository;

import com.School.School_management.Entity.Gallery;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GalleryRepository extends JpaRepository<Gallery, Long> {
    List<Gallery> findAllByIsDeletedFalseOrderByIdDesc();
    List<Gallery> findBySchoolIdAndIsDeletedFalseOrderByIdDesc(Long schoolId);
}
