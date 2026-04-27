package com.School.School_management.repo;

import com.School.School_management.Entity.ManageSchool;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SchoolRepository extends JpaRepository<ManageSchool, Long> {
}
