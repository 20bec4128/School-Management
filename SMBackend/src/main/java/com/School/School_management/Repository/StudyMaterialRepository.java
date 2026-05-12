// Repository/StudyMaterialRepository.java
package com.School.School_management.Repository;

import com.School.School_management.Entity.StudyMaterial;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyMaterialRepository extends JpaRepository<StudyMaterial, Long> {
    List<StudyMaterial> findBySchoolId(Long schoolId);

    List<StudyMaterial> findBySchoolIdAndClassId(Long schoolId, Long classId);

    List<StudyMaterial> findBySubjectIdIn(Collection<Long> subjectIds);

    boolean existsBySchoolId(Long schoolId);
}
