package com.School.School_management.Repository;

import java.util.*;

import org.springframework.data.jpa.repository.JpaRepository;

import com.School.School_management.Entity.Submission;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    List<Submission> findByAssignmentId(Long assignmentId);

    List<Submission> findByAssignmentIdIn(Collection<Long> assignmentIds);

    List<Submission> findByStudentId(Long studentId);

    Optional<Submission> findByAssignmentIdAndStudentId(Long assignmentId, Long studentId);

    List<Submission> findBySchoolId(Long schoolId);

    boolean existsBySchoolId(Long schoolId);
}
