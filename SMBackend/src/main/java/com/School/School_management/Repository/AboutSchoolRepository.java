package com.School.School_management.Repository;

import com.School.School_management.Entity.AboutSchool;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AboutSchoolRepository extends JpaRepository<AboutSchool, Long> {
    List<AboutSchool> findAllByDeletedFalseOrderByIdDesc();
    List<AboutSchool> findBySchoolIdAndDeletedFalseOrderByIdDesc(Long schoolId);
    List<AboutSchool> findBySchoolIdInAndDeletedFalseOrderByIdDesc(Collection<Long> schoolIds);
    Optional<AboutSchool> findByIdAndDeletedFalse(Long id);
    Optional<AboutSchool> findBySchoolIdAndDeletedFalse(Long schoolId);
    boolean existsBySchoolIdAndDeletedFalse(Long schoolId);
    boolean existsBySchoolIdAndDeletedFalseAndIdNot(Long schoolId, Long id);
}
