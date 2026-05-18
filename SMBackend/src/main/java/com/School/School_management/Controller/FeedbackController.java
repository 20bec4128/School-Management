package com.School.School_management.Controller;

import com.School.School_management.Dto.FeedbackDto;
import com.School.School_management.Service.FeedbackService;
import com.School.School_management.auth.RequirePermission;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/feedbacks")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @GetMapping
    public Page<FeedbackDto> getFeedbacks(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return feedbackService.getFeedbacks(schoolId, search, page, size);
    }

    @PostMapping
    public FeedbackDto createFeedback(@RequestBody FeedbackDto dto) {
        return feedbackService.createFeedback(dto);
    }

    @PatchMapping("/{id}/toggle-publish")
    public FeedbackDto togglePublish(@PathVariable Long id) {
        return feedbackService.togglePublish(id);
    }

    @DeleteMapping("/{id}")
    public String deleteFeedback(@PathVariable Long id) {
        feedbackService.deleteFeedback(id);
        return "Feedback deleted successfully";
    }
}
