package com.School.School_management.Repository;

import com.School.School_management.Entity.Hostel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface HostelRepositoryCustom {
    List<Hostel> findAllActiveWithDetailsOrderByIdDesc();
    List<Hostel> findBySchoolIdActiveWithDetailsOrderByIdDesc(Long schoolId);
    List<Hostel> findByHeadOfficeIdActiveWithDetailsOrderByIdDesc(Long headOfficeId);
    Page<Hostel> findPageWithDetails(Long headOfficeId, Long schoolId, String search, Pageable pageable);
    Optional<Hostel> findByIdWithDetails(Long id);
}
