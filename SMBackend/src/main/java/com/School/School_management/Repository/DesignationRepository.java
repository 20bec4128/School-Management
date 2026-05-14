package com.School.School_management.Repository;

import com.School.School_management.Entity.Designation;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DesignationRepository extends JpaRepository<Designation, Long> {
    List<Designation> findBySchoolIdOrderByIdDesc(Long schoolId);

    Page<Designation> findBySchoolIdOrderByIdDesc(Long schoolId, Pageable pageable);

    @Query("SELECT d FROM Designation d WHERE d.schoolId = :schoolId " +
           "AND (:search IS NULL OR LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Designation> searchDesignations(@Param("schoolId") Long schoolId, @Param("search") String search, Pageable pageable);

    List<Designation> findBySchoolIdAndRoleIgnoreCaseOrderByIdDesc(Long schoolId, String role);

    List<Designation> findBySchoolIdInOrderByIdDesc(Collection<Long> schoolIds);

    List<Designation> findAllByOrderByIdDesc();

    boolean existsBySchoolIdAndRoleIgnoreCaseAndNameIgnoreCase(Long schoolId, String role, String name);

    boolean existsBySchoolIdAndRoleIgnoreCaseAndNameIgnoreCaseAndIdNot(Long schoolId, String role, String name, Long id);
}
