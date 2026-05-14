package com.School.School_management.Repository;

import com.School.School_management.Entity.FeeType;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FeeTypeRepository extends JpaRepository<FeeType, Long> {

    List<FeeType> findBySchoolIdOrderByIdDesc(Long schoolId);

    Page<FeeType> findBySchoolIdOrderByIdDesc(Long schoolId, Pageable pageable);

    @Query("SELECT f FROM FeeType f WHERE f.schoolId = :schoolId " +
           "AND (:search IS NULL OR LOWER(f.title) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(f.feeType) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<FeeType> searchFeeTypes(@Param("schoolId") Long schoolId, @Param("search") String search, Pageable pageable);

    List<FeeType> findAllByOrderByIdDesc();

    boolean existsBySchoolIdAndTitleIgnoreCaseAndFeeTypeIgnoreCase(Long schoolId, String title, String feeType);

    boolean existsBySchoolIdAndTitleIgnoreCaseAndFeeTypeIgnoreCaseAndIdNot(Long schoolId, String title, String feeType, Long id);
}
