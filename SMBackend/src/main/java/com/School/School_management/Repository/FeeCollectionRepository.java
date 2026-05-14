package com.School.School_management.Repository;

import com.School.School_management.Entity.FeeCollection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FeeCollectionRepository extends JpaRepository<FeeCollection, Long>, FeeCollectionRepositoryCustom {
}
