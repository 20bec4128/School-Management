package com.School.School_management.Repository;

import com.School.School_management.Entity.SchoolEvent;
import java.util.List;
import java.util.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventRepository extends JpaRepository<SchoolEvent, Long> {
    List<SchoolEvent> findAllByIsDeletedFalseOrderByIdDesc();
    List<SchoolEvent> findBySchoolIdAndIsDeletedFalseOrderByIdDesc(Long schoolId);
    List<SchoolEvent> findAllByIsDeletedFalseAndSchoolIdInOrderByIdDesc(Collection<Long> schoolIds);
}
