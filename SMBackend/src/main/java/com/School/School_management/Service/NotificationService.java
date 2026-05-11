package com.School.School_management.Service;

import com.School.School_management.Dto.NotificationResponseDto;
import com.School.School_management.auth.CurrentUser;
import java.util.List;

public interface NotificationService {
    List<NotificationResponseDto> getMyNotifications(CurrentUser user);
    NotificationResponseDto markRead(Long id, CurrentUser user);
    List<NotificationResponseDto> markAllRead(CurrentUser user);
}
