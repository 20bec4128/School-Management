// com/School/School_management/Repository/StudentActivityRepository.java
package com.School.School_management.Repository;

import com.School.School_management.Entity.StudentActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentActivityRepository extends JpaRepository<StudentActivity, Long> {
    
    Page<StudentActivity> findByDeletedFalse(Pageable pageable);
    
    Page<StudentActivity> findBySchoolIdAndDeletedFalse(Long schoolId, Pageable pageable);
    
    @Query("SELECT sa FROM StudentActivity sa WHERE sa.deleted = false AND " +
           "(:headOfficeId IS NULL OR sa.school.headOfficeId = :headOfficeId) AND " +
           "(:schoolId IS NULL OR sa.school.id = :schoolId) AND " +
           "(:className IS NULL OR sa.className = :className) AND " +
           "(:section IS NULL OR sa.section = :section)")
    Page<StudentActivity> searchActivities(@Param("headOfficeId") Long headOfficeId,
                                            @Param("schoolId") Long schoolId,
                                            @Param("className") String className,
                                            @Param("section") String section,
                                            Pageable pageable);
}
