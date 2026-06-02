package com.School.School_management.Controller;

import com.School.School_management.Dto.FeedbackDto;
import com.School.School_management.Service.FeedbackService;
import com.School.School_management.auth.RequirePagePermission;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/feedbacks")
@RequirePagePermission(slug = "feedback", action = "view")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @GetMapping
    @RequirePagePermission(slug = "feedback", action = "view")
    public Page<FeedbackDto> getFeedbacks(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return feedbackService.getFeedbacks(schoolId, search, page, size);
    }

    @PostMapping
    @RequirePagePermission(slug = "feedback", action = "add")
    public FeedbackDto createFeedback(@RequestBody FeedbackDto dto) {
        return feedbackService.createFeedback(dto);
    }

    @PatchMapping("/{id}/toggle-publish")
    @RequirePagePermission(slug = "feedback", action = "edit")
    public FeedbackDto togglePublish(@PathVariable Long id) {
        return feedbackService.togglePublish(id);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "feedback", action = "delete")
    public String deleteFeedback(@PathVariable Long id) {
        feedbackService.deleteFeedback(id);
        return "Feedback deleted successfully";
    }
}
