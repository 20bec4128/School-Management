package com.School.School_management.Repository;

import com.School.School_management.Entity.CallLog;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CallLogRepository extends JpaRepository<CallLog, Long> {
    List<CallLog> findBySchoolIdAndIsDeletedFalse(Long schoolId);

    @Query(value = """
            select c from CallLog c
            where c.schoolId = :schoolId
              and c.isDeleted = false
              and (:callType is null or c.callType = :callType)
              and (
                :search is null
                or lower(coalesce(c.name, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(c.phone, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(c.callDuration, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(c.callType, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(c.note, '')) like lower(concat('%', :search, '%'))
              )
            order by c.id desc
            """,
            countQuery = """
            select count(c) from CallLog c
            where c.schoolId = :schoolId
              and c.isDeleted = false
              and (:callType is null or c.callType = :callType)
              and (
                :search is null
                or lower(coalesce(c.name, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(c.phone, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(c.callDuration, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(c.callType, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(c.note, '')) like lower(concat('%', :search, '%'))
              )
            """)
    Page<CallLog> pageBySchoolId(
            @Param("schoolId") Long schoolId,
            @Param("search") String search,
            @Param("callType") String callType,
            Pageable pageable);
}
