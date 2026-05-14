package com.School.School_management.Repository;

import com.School.School_management.Entity.Discount;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DiscountRepository extends JpaRepository<Discount, Long> {

    List<Discount> findBySchoolIdOrderByIdDesc(Long schoolId);

    Page<Discount> findBySchoolIdOrderByIdDesc(Long schoolId, Pageable pageable);

    @Query("SELECT d FROM Discount d WHERE d.schoolId = :schoolId " +
           "AND (:search IS NULL OR LOWER(d.title) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Discount> searchDiscounts(@Param("schoolId") Long schoolId, @Param("search") String search, Pageable pageable);

    List<Discount> findAllByOrderByIdDesc();

    boolean existsBySchoolIdAndTitleIgnoreCase(Long schoolId, String title);

    boolean existsBySchoolIdAndTitleIgnoreCaseAndIdNot(Long schoolId, String title, Long id);
}
