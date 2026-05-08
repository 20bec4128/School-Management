package com.School.School_management.Repository;

import com.School.School_management.Entity.ParentStudent;
import com.School.School_management.Entity.ParentStudentKey;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ParentStudentRepository extends JpaRepository<ParentStudent, ParentStudentKey> {
    @Query("select ps.id.studentId from ParentStudent ps where ps.id.parentId = :parentId")
    List<Long> findStudentIdsByParentId(@Param("parentId") Long parentId);

    @Query("select ps.id.parentId from ParentStudent ps where ps.id.studentId = :studentId")
    List<Long> findParentIdsByStudentId(@Param("studentId") Long studentId);

    @Modifying
    @Query("delete from ParentStudent ps where ps.id.studentId = :studentId")
    void deleteByStudentId(@Param("studentId") Long studentId);
}
