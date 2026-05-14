package com.School.School_management.Repository;

import com.School.School_management.Entity.PostalReceive;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostalReceiveRepository extends JpaRepository<PostalReceive, Long> {
    List<PostalReceive> findBySchoolIdAndIsDeletedFalse(Long schoolId);
}
