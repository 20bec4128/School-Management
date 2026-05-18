package com.School.School_management.Repository;

import com.School.School_management.Entity.ExamInstruction;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExamInstructionRepository extends JpaRepository<ExamInstruction, Long> {
    List<ExamInstruction> findBySchool_IdAndDeletedFalseOrderByIdDesc(Long schoolId);
    List<ExamInstruction> findBySchool_HeadOfficeIdAndDeletedFalseOrderByIdDesc(Long headOfficeId);
    List<ExamInstruction> findAllByDeletedFalseOrderByIdDesc();
}
