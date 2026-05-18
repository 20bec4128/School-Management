package com.School.School_management.Repository;

import com.School.School_management.Entity.Studenttype;
import java.util.Collection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentTypeRepository extends JpaRepository<Studenttype, Long> {

    // All student types for a specific school (paginated)
    Page<Studenttype> findBySchoolId(Long schoolId, Pageable pageable);

    @Query("select st from Studenttype st where st.school.id in :schoolIds order by st.id asc")
    Page<Studenttype> findBySchoolIdIn(Collection<Long> schoolIds, Pageable pageable);

    // Check for duplicates within the same school before saving
    boolean existsBySchoolIdAndStudentTypeIgnoreCase(Long schoolId, String studentType);

    // Same check but exclude the current record (for updates)
    boolean existsBySchoolIdAndStudentTypeIgnoreCaseAndIdNot(Long schoolId, String studentType, Long id);
}
