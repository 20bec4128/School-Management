package com.School.School_management.Repository;

import com.School.School_management.Entity.ComplainType;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComplainTypeRepository extends JpaRepository<ComplainType, Long> {
    List<ComplainType> findBySchoolIdAndIsDeletedFalse(Long schoolId);

    Page<ComplainType> findBySchoolIdAndIsDeletedFalseOrderByIdDesc(Long schoolId, Pageable pageable);

    Page<ComplainType> findBySchoolIdAndIsDeletedFalseAndComplainTypeContainingIgnoreCaseOrderByIdDesc(Long schoolId, String complainType, Pageable pageable);
}
