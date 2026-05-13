package com.School.School_management.Repository;

import com.School.School_management.Entity.Designation;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DesignationRepository extends JpaRepository<Designation, Long> {
    List<Designation> findBySchoolIdOrderByIdDesc(Long schoolId);

    List<Designation> findBySchoolIdAndRoleIgnoreCaseOrderByIdDesc(Long schoolId, String role);

    List<Designation> findBySchoolIdInOrderByIdDesc(Collection<Long> schoolIds);

    List<Designation> findAllByOrderByIdDesc();

    boolean existsBySchoolIdAndRoleIgnoreCaseAndNameIgnoreCase(Long schoolId, String role, String name);

    boolean existsBySchoolIdAndRoleIgnoreCaseAndNameIgnoreCaseAndIdNot(Long schoolId, String role, String name, Long id);
}
