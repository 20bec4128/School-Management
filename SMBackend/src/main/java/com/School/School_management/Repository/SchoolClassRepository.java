package com.School.School_management.Repository;

import com.School.School_management.Entity.SchoolClass;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SchoolClassRepository extends JpaRepository<SchoolClass, Long> {

  List<SchoolClass> findAllBySchool_IdOrderByIdDesc(Long schoolId);

  List<SchoolClass> findAllBySchool_HeadOfficeIdAndSchool_IsDeletedFalseOrderByIdDesc(Long headOfficeId);

  boolean existsByIdAndSchool_Id(Long id, Long schoolId);

  boolean existsByIdAndSchool_IdAndClassTeacher_Id(Long id, Long schoolId, Long classTeacherId);
}

