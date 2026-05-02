package com.School.School_management.Repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.School.School_management.Entity.Assignment;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    List<Assignment> findByClassIdAndSectionId(Long classId, Long sectionId);

    List<Assignment> findBySubjectId(Long subjectId);

    List<Assignment> findBySchoolId(Long schoolId);

    List<Assignment> findBySchoolIdAndClassIdAndSectionId(Long schoolId, Long classId, Long sectionId);

    List<Assignment> findBySubjectIdIn(Collection<Long> subjectIds);

    boolean existsBySchoolId(Long schoolId);
}
