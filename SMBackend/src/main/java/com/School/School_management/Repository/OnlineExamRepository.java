package com.School.School_management.Repository;

import com.School.School_management.Entity.OnlineExam;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OnlineExamRepository extends JpaRepository<OnlineExam, Long> {
    List<OnlineExam> findBySchool_IdAndDeletedFalseOrderByIdDesc(Long schoolId);
    List<OnlineExam> findBySchool_HeadOfficeIdAndDeletedFalseOrderByIdDesc(Long headOfficeId);
    List<OnlineExam> findAllByDeletedFalseOrderByIdDesc();
}
