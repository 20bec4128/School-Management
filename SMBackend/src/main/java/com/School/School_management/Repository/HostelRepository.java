package com.School.School_management.Repository;

import com.School.School_management.Entity.Hostel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HostelRepository extends JpaRepository<Hostel, Long>, HostelRepositoryCustom {
}
