package com.School.School_management.Repository;

import com.School.School_management.Entity.Subject;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {
    List<Subject> findByTeacher_Id(Long teacherId);

    boolean existsByIdAndSchool_Id(Long id, Long schoolId);

    boolean existsByIdAndSchool_IdAndSchoolClass_Id(Long id, Long schoolId, Long classId);
}
