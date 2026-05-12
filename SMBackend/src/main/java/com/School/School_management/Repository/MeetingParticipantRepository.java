package com.School.School_management.Repository;

import com.School.School_management.Entity.MeetingParticipant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MeetingParticipantRepository extends JpaRepository<MeetingParticipant, Long> {

    @Query("""
            SELECT mp FROM MeetingParticipant mp
            WHERE mp.liveClass.id = :liveClassId
              AND mp.userId = :userId
              AND mp.leaveTime IS NULL
            ORDER BY mp.joinTime DESC
            """)
    Optional<MeetingParticipant> findActiveSession(@Param("liveClassId") Long liveClassId, @Param("userId") Long userId);
}

