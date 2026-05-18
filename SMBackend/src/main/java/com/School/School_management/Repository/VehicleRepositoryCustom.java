package com.School.School_management.Repository;

import com.School.School_management.Entity.Vehicle;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface VehicleRepositoryCustom {
    List<Vehicle> findAllActiveWithDetailsOrderByIdDesc();
    List<Vehicle> findByHeadOfficeIdActiveWithDetailsOrderByIdDesc(Long headOfficeId);
    List<Vehicle> findBySchoolIdActiveWithDetailsOrderByIdDesc(Long schoolId);
    Page<Vehicle> findPageWithDetails(Long headOfficeId, Long schoolId, String search, Pageable pageable);
    Optional<Vehicle> findByIdWithDetails(Long id);
}
