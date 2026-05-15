package com.School.School_management.Repository;

import com.School.School_management.Entity.TransportRoute;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface TransportRouteRepositoryCustom {
    List<TransportRoute> findAllActiveWithDetailsOrderByIdDesc();
    List<TransportRoute> findByHeadOfficeIdActiveWithDetailsOrderByIdDesc(Long headOfficeId);
    List<TransportRoute> findBySchoolIdActiveWithDetailsOrderByIdDesc(Long schoolId);
    Page<TransportRoute> findPageWithDetails(Long headOfficeId, Long schoolId, String search, Pageable pageable);
    Optional<TransportRoute> findByIdWithDetails(Long id);
}
