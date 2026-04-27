package com.School.School_management.Repository;

import com.School.School_management.Entity.SchoolSection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SchoolSectionRepository extends JpaRepository<SchoolSection, Long> {

  List<SchoolSection> findAllBySchool_IdOrderByIdDesc(Long schoolId);

  List<SchoolSection> findAllBySchoolClass_IdOrderByIdDesc(Long classId);

  List<SchoolSection> findAllBySchool_IdAndSchoolClass_IdOrderByIdDesc(Long schoolId, Long classId);
}

