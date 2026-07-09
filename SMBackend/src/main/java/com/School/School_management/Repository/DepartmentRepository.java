package com.School.School_management.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;

import com.School.School_management.Entity.Department;
import java.util.List;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    @Override
    @EntityGraph(attributePaths = "school")
    Page<Department> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "school")
    List<Department> findBySchool_IdOrderByTitleAsc(Long schoolId);

    @EntityGraph(attributePaths = "school")
    Page<Department> findBySchool_Id(Long schoolId, Pageable pageable);
}
