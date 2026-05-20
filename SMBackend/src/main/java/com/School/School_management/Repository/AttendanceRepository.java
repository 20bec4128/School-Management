package com.School.School_management.Repository;

import com.School.School_management.Entity.Attendance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    @Query("SELECT a FROM Attendance a WHERE " +
           "(:headOfficeId IS NULL OR a.headOfficeId = :headOfficeId) AND " +
           "(:schoolId IS NULL OR a.schoolId = :schoolId) AND " +
           "(:examTerm IS NULL OR a.examTerm = :examTerm) AND " +
           "(:className IS NULL OR a.className = :className) AND " +
           "(:sectionName IS NULL OR a.sectionName = :sectionName) AND " +
           "(:subjectName IS NULL OR a.subjectName = :subjectName) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(a.phone) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(a.rollNo) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(a.attendAll) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Attendance> findAllWithFilters(@Param("headOfficeId") Long headOfficeId,
                                        @Param("schoolId") Long schoolId,
                                        @Param("examTerm") String examTerm,
                                        @Param("className") String className,
                                        @Param("sectionName") String sectionName,
                                        @Param("subjectName") String subjectName,
                                        @Param("search") String search);

    @Query("SELECT a FROM Attendance a WHERE " +
           "(:headOfficeId IS NULL OR a.headOfficeId = :headOfficeId) AND " +
           "(:schoolId IS NULL OR a.schoolId = :schoolId) AND " +
           "(:examTerm IS NULL OR a.examTerm = :examTerm) AND " +
           "(:className IS NULL OR a.className = :className) AND " +
           "(:sectionName IS NULL OR a.sectionName = :sectionName) AND " +
           "(:subjectName IS NULL OR a.subjectName = :subjectName) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(a.phone) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(a.rollNo) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(a.attendAll) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Attendance> findAllWithFiltersPaginated(@Param("headOfficeId") Long headOfficeId,
                                                 @Param("schoolId") Long schoolId,
                                                 @Param("examTerm") String examTerm,
                                                 @Param("className") String className,
                                                 @Param("sectionName") String sectionName,
                                                 @Param("subjectName") String subjectName,
                                                 @Param("search") String search,
                                                 Pageable pageable);

    @Query("SELECT a FROM Attendance a WHERE " +
            "a.schoolId = :schoolId AND " +
            "a.examTerm = :examTerm AND " +
            "a.className = :className AND " +
            "((:sectionName IS NULL AND a.sectionName IS NULL) OR a.sectionName = :sectionName) AND " +
            "a.subjectName = :subjectName AND " +
            "a.rollNo = :rollNo AND " +
            "a.attendanceDate = :attendanceDate")
    Optional<Attendance> findExistingAttendance(@Param("schoolId") Long schoolId,
                                                @Param("examTerm") String examTerm,
                                                @Param("className") String className,
                                                @Param("sectionName") String sectionName,
                                                @Param("subjectName") String subjectName,
                                                @Param("rollNo") String rollNo,
                                                @Param("attendanceDate") java.time.LocalDate attendanceDate);
}
