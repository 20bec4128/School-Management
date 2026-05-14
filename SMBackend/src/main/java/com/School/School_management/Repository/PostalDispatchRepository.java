package com.School.School_management.Repository;

import com.School.School_management.Entity.PostalDispatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostalDispatchRepository extends JpaRepository<PostalDispatch, Long> {
    List<PostalDispatch> findBySchoolIdAndIsDeletedFalse(Long schoolId);
}
