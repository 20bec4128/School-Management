package com.School.School_management.Repository;

import com.School.School_management.Entity.Complain;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComplainRepository extends JpaRepository<Complain, Long> {
    List<Complain> findBySchoolIdAndIsDeletedFalse(Long schoolId);
}
