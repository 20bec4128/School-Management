package com.School.School_management.Repository;

import com.School.School_management.Entity.ComplainType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComplainTypeRepository extends JpaRepository<ComplainType, Long> {
    List<ComplainType> findBySchoolIdAndIsDeletedFalse(Long schoolId);
}
