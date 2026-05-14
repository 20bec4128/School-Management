package com.School.School_management.Repository;

import com.School.School_management.Entity.Room;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface RoomRepositoryCustom {
    List<Room> findAllActiveWithDetailsOrderByIdDesc();
    List<Room> findBySchoolIdActiveWithDetailsOrderByIdDesc(Long schoolId);
    List<Room> findByHeadOfficeIdActiveWithDetailsOrderByIdDesc(Long headOfficeId);
    List<Room> findByFilters(Long headOfficeId, Long schoolId, Long hostelId, String roomType);
    Page<Room> findPageWithDetails(Long headOfficeId, Long schoolId, Long hostelId, String roomType, String search, Pageable pageable);
    Optional<Room> findByIdWithDetails(Long id);
}
