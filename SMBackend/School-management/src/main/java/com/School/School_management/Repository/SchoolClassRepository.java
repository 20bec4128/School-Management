package com.School.School_management.Repository;

import com.School.School_management.Entity.SchoolClass;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SchoolClassRepository extends JpaRepository<SchoolClass, Long> {

  List<SchoolClass> findAllBySchool_IdOrderByIdDesc(Long schoolId);
}

