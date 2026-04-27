package com.School.School_management.repo;

import com.School.School_management.Entity.ManageTeacher;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeacherRepository extends JpaRepository<ManageTeacher, Long> {
}
