package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.NotificationResponseDto;
import com.School.School_management.Entity.Notification;
import com.School.School_management.Entity.Student;
import com.School.School_management.Repository.NotificationRepository;
import com.School.School_management.Repository.StudentRepository;
import com.School.School_management.Service.NotificationService;
import com.School.School_management.auth.CurrentUser;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final StudentRepository studentRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository, StudentRepository studentRepository) {
        this.notificationRepository = notificationRepository;
        this.studentRepository = studentRepository;
    }

    @Override
    public List<NotificationResponseDto> getMyNotifications(CurrentUser user) {
        Optional<Student> student = findStudent(user);
        if (student.isPresent()) {
            return notificationRepository.findAllByStudent_IdOrderByCreatedAtDesc(student.get().getId())
                    .stream()
                    .map(this::map)
                    .toList();
        }
        return notificationRepository.findAllByOrderByCreatedAtDesc().stream().map(this::map).toList();
    }

    @Override
    @Transactional
    public NotificationResponseDto markRead(Long id, CurrentUser user) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        ensureAllowed(notification, user);
        notification.setRead(true);
        return map(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public List<NotificationResponseDto> markAllRead(CurrentUser user) {
        Optional<Student> student = findStudent(user);
        List<Notification> notifications = student
                .map(value -> notificationRepository.findAllByStudent_IdAndReadFalse(value.getId()))
                .orElseGet(notificationRepository::findAllByOrderByCreatedAtDesc);
        notifications.forEach(notification -> notification.setRead(true));
        return notificationRepository.saveAll(notifications).stream().map(this::map).toList();
    }

    private void ensureAllowed(Notification notification, CurrentUser user) {
        Optional<Student> student = findStudent(user);
        if (student.isEmpty()) return;
        Student recipient = notification.getStudent();
        if (recipient == null || !student.get().getId().equals(recipient.getId())) {
            throw new IllegalArgumentException("Notification not found");
        }
    }

    private Optional<Student> findStudent(CurrentUser user) {
        if (user == null || user.username() == null) return Optional.empty();
        if (!user.isRole("STUDENT") || user.studentId() == null) return Optional.empty();
        return studentRepository.findById(user.studentId())
                .filter(s -> Boolean.FALSE.equals(s.getDeleted()) || s.getDeleted() == null);
    }

    private NotificationResponseDto map(Notification notification) {
        NotificationResponseDto dto = new NotificationResponseDto();
        dto.setId(notification.getId());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setType(notification.getType());
        dto.setReferenceId(notification.getReferenceId());
        if (notification.getStudent() != null) {
            dto.setStudentId(notification.getStudent().getId());
            dto.setStudentName(notification.getStudent().getName());
        }
        dto.setTargetRole(notification.getTargetRole());
        dto.setIsRead(Boolean.TRUE.equals(notification.getRead()));
        dto.setCreatedAt(notification.getCreatedAt());
        return dto;
    }
}
