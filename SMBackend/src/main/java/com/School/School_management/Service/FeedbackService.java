package com.School.School_management.Service;

import com.School.School_management.Dto.FeedbackDto;
import org.springframework.data.domain.Page;

public interface FeedbackService {
    Page<FeedbackDto> getFeedbacks(Long schoolId, String search, int page, int size);
    FeedbackDto createFeedback(FeedbackDto dto);
    FeedbackDto togglePublish(Long id);
    void deleteFeedback(Long id);
}
