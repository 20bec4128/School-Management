package com.School.School_management.Repository;

import com.School.School_management.Entity.FeeCollection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeeCollectionRepository extends JpaRepository<FeeCollection, Long> {
    List<FeeCollection> findByDeletedFalse();
    List<FeeCollection> findBySchool_IdAndDeletedFalse(Long schoolId);
}
