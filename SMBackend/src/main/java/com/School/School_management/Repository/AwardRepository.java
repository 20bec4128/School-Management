package com.School.School_management.Repository;

import com.School.School_management.Entity.Award;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AwardRepository extends JpaRepository<Award, Long> {
    List<Award> findAllByDeletedFalseOrderByIdDesc();

    List<Award> findBySchoolIdAndDeletedFalseOrderByIdDesc(Long schoolId);

    List<Award> findBySchoolIdInAndDeletedFalseOrderByIdDesc(Collection<Long> schoolIds);

    Optional<Award> findByIdAndDeletedFalse(Long id);
}
