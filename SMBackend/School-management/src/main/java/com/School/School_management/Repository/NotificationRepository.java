package com.School.School_management.Repository;

import com.School.School_management.Entity.Notification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findAllByOrderByCreatedAtDesc();

    List<Notification> findAllByStudent_IdOrderByCreatedAtDesc(Long studentId);

    List<Notification> findAllByStudent_IdAndReadFalse(Long studentId);
}
