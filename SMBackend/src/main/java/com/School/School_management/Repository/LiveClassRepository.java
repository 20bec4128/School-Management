package com.School.School_management.Repository;

import com.School.School_management.Entity.LiveClass;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LiveClassRepository extends JpaRepository<LiveClass, Long> {

    List<LiveClass> findAllByOrderByClassDateDescStartTimeDesc();

    List<LiveClass> findAllBySchoolClass_IdAndSection_IdOrderByClassDateDescStartTimeDesc(Long classId, Long sectionId);

    List<LiveClass> findAllBySchool_IdOrderByClassDateDescStartTimeDesc(Long schoolId);

    List<LiveClass> findAllByTeacher_IdOrderByClassDateDescStartTimeDesc(Long teacherId);

    boolean existsBySchool_Id(Long schoolId);

    @Query("""
            SELECT COUNT(l) > 0 FROM LiveClass l
            WHERE (:excludeId IS NULL OR l.id <> :excludeId)
              AND l.teacher.id = :teacherId
              AND l.classDate = :classDate
              AND l.startTime < :endTime
              AND l.endTime > :startTime
              AND l.status <> 'Cancelled'
            """)
    boolean existsTeacherOverlap(@Param("teacherId") Long teacherId,
                                 @Param("classDate") LocalDate classDate,
                                 @Param("startTime") LocalTime startTime,
                                 @Param("endTime") LocalTime endTime,
                                 @Param("excludeId") Long excludeId);

    @Query("""
            SELECT COUNT(l) > 0 FROM LiveClass l
            WHERE (:excludeId IS NULL OR l.id <> :excludeId)
              AND l.schoolClass.id = :classId
              AND l.section.id = :sectionId
              AND l.classDate = :classDate
              AND l.startTime < :endTime
              AND l.endTime > :startTime
              AND l.status <> 'Cancelled'
            """)
    boolean existsClassSectionOverlap(@Param("classId") Long classId,
                                      @Param("sectionId") Long sectionId,
                                      @Param("classDate") LocalDate classDate,
                                      @Param("startTime") LocalTime startTime,
                                      @Param("endTime") LocalTime endTime,
                                      @Param("excludeId") Long excludeId);
}
