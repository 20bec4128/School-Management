package com.School.School_management.Repository;

import com.School.School_management.Entity.Notice;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {
    List<Notice> findAllByIsDeletedFalseOrderByIdDesc();
    List<Notice> findBySchoolIdAndIsDeletedFalseOrderByIdDesc(Long schoolId);
}
