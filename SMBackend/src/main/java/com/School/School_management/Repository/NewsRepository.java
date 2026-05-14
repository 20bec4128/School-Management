package com.School.School_management.Repository;

import com.School.School_management.Entity.News;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NewsRepository extends JpaRepository<News, Long> {
    List<News> findAllByIsDeletedFalseOrderByIdDesc();
    List<News> findBySchoolIdAndIsDeletedFalseOrderByIdDesc(Long schoolId);
}
