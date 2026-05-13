package com.School.School_management.Repository;

import com.School.School_management.Entity.Employee;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findBySchoolIdOrderByIdDesc(Long schoolId);
    List<Employee> findAllByOrderByIdDesc();
    java.util.Optional<Employee> findByUsername(String username);
}
