// com/School/School_management/Repository/StudentRepository.java
package com.School.School_management.Repository;

import com.School.School_management.Entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    
    Page<Student> findBySchoolId(Long schoolId, Pageable pageable);
    
    Page<Student> findBySchoolIdAndDeletedFalse(Long schoolId, Pageable pageable);
    
    Page<Student> findByDeletedFalse(Pageable pageable);
    
    boolean existsByAdmissionNo(String admissionNo);
    
    boolean existsByUsername(String username);
    
    @Query("SELECT s FROM Student s WHERE s.deleted = false AND " +
           "(:schoolId IS NULL OR s.school.id = :schoolId) AND " +
           "(:className IS NULL OR s.className = :className) AND " +
           "(:section IS NULL OR s.section = :section) AND " +
           "(:groupName IS NULL OR s.groupName = :groupName)")
    Page<Student> searchStudents(@Param("schoolId") Long schoolId,
                                  @Param("className") String className,
                                  @Param("section") String section,
                                  @Param("groupName") String groupName,
                                  Pageable pageable);
}