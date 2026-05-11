package com.School.School_management.Repository;

import com.School.School_management.Entity.ManageTeacher;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeacherRepository extends JpaRepository<ManageTeacher, Long> {
    Optional<ManageTeacher> findByUsername(String username);

    boolean existsByIdAndSchoolId(Long id, Long schoolId);
}
