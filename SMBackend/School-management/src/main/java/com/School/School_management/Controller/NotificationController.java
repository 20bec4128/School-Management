package com.School.School_management.Controller;

import com.School.School_management.Dto.NotificationResponseDto;
import com.School.School_management.Service.NotificationService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.JwtAuthInterceptor;
import com.School.School_management.auth.RequirePermission;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @RequirePermission({"NOTIFICATION_VIEW_OWN", "NOTIFICATION_VIEW_CHILD", "*"})
    @GetMapping("/my")
    public List<NotificationResponseDto> my(HttpServletRequest request) {
        return notificationService.getMyNotifications(currentUser(request));
    }

    @RequirePermission({"NOTIFICATION_VIEW_OWN", "NOTIFICATION_VIEW_CHILD", "*"})
    @PutMapping("/{id}/read")
    public NotificationResponseDto markRead(@PathVariable Long id, HttpServletRequest request) {
        return notificationService.markRead(id, currentUser(request));
    }

    @RequirePermission({"NOTIFICATION_VIEW_OWN", "NOTIFICATION_VIEW_CHILD", "*"})
    @PutMapping("/read-all")
    public List<NotificationResponseDto> markAllRead(HttpServletRequest request) {
        return notificationService.markAllRead(currentUser(request));
    }

    private CurrentUser currentUser(HttpServletRequest request) {
        Object user = request.getAttribute(JwtAuthInterceptor.ATTR_USER);
        return user instanceof CurrentUser currentUser ? currentUser : null;
    }
}
