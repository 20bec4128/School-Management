package com.School.School_management.Repository;

import com.School.School_management.Entity.Slider;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SliderRepository extends JpaRepository<Slider, Long> {
    List<Slider> findAllByDeletedFalseOrderByIdDesc();
    List<Slider> findBySchoolIdAndDeletedFalseOrderByIdDesc(Long schoolId);
    List<Slider> findBySchoolIdInAndDeletedFalseOrderByIdDesc(Collection<Long> schoolIds);
    Optional<Slider> findByIdAndDeletedFalse(Long id);
}
