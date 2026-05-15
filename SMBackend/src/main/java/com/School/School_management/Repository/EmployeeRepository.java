package com.School.School_management.Repository;

import com.School.School_management.Entity.Employee;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findBySchoolIdOrderByIdDesc(Long schoolId);

    @org.springframework.data.jpa.repository.Query("SELECT e FROM Employee e WHERE e.schoolId = :schoolId " +
            "AND (:search IS NULL OR LOWER(e.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(e.phone) LIKE LOWER(CONCAT('%', :search, '%')))")
    org.springframework.data.domain.Page<Employee> searchEmployees(
            @org.springframework.data.repository.query.Param("schoolId") Long schoolId,
            @org.springframework.data.repository.query.Param("search") String search,
            org.springframework.data.domain.Pageable pageable);

    List<Employee> findBySchoolIdAndRoleIgnoreCaseOrderByIdDesc(Long schoolId, String role);

    @Query("select distinct e.role from Employee e where e.schoolId = :schoolId and e.role is not null order by e.role")
    List<String> findDistinctRolesBySchoolId(@Param("schoolId") Long schoolId);

    List<Employee> findAllByOrderByIdDesc();
    java.util.Optional<Employee> findByUsername(String username);
}
