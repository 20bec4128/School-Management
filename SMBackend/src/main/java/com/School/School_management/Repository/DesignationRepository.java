package com.School.School_management.Repository;

import com.School.School_management.Entity.Designation;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DesignationRepository extends JpaRepository<Designation, Long> {
    List<Designation> findBySchoolIdOrderByIdDesc(Long schoolId);

    List<Designation> findBySchoolIdInOrderByIdDesc(Collection<Long> schoolIds);

    List<Designation> findAllByOrderByIdDesc();

    boolean existsBySchoolIdAndNameIgnoreCase(Long schoolId, String name);
}
