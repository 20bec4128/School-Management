package com.School.School_management.Repository;

import com.School.School_management.Entity.QuestionBank;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestionBankRepository extends JpaRepository<QuestionBank, Long> {
    List<QuestionBank> findBySchool_IdAndDeletedFalseOrderByIdDesc(Long schoolId);
    List<QuestionBank> findAllByDeletedFalseOrderByIdDesc();
}
