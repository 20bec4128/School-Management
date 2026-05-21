package com.School.School_management.Repository;

import com.School.School_management.Entity.FrontendPage;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FrontendPageRepository extends JpaRepository<FrontendPage, Long> {
    List<FrontendPage> findAllByDeletedFalseOrderByIdDesc();
    List<FrontendPage> findBySchoolIdAndDeletedFalseOrderByIdDesc(Long schoolId);
    List<FrontendPage> findBySchoolIdInAndDeletedFalseOrderByIdDesc(Collection<Long> schoolIds);
    Optional<FrontendPage> findByIdAndDeletedFalse(Long id);
    boolean existsBySchoolIdAndUrlSlugAndDeletedFalse(Long schoolId, String urlSlug);
    boolean existsBySchoolIdAndUrlSlugAndIdNotAndDeletedFalse(Long schoolId, String urlSlug, Long id);
}
