package com.School.School_management.Controller;

import com.School.School_management.Dto.QuestionBankDto;
import com.School.School_management.Service.QuestionBankService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/question-bank")
@CrossOrigin(
        originPatterns = {
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://school.infitoolz.com",
                "http://school.infitoolz.com"
        },
        allowCredentials = "true"
)
public class QuestionBankController {

    @Autowired
    private QuestionBankService questionBankService;

    @GetMapping("/page")
    public ResponseEntity<Map<String, Object>> getQuestionBanksPage(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String questionType,
            @RequestParam(required = false) String questionLevel,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(questionBankService.getQuestionBanksPage(schoolId, classId, subjectId, questionType, questionLevel, status, page, size, search));
    }

    @PostMapping("/create")
    public ResponseEntity<QuestionBankDto> createQuestionBank(@RequestBody QuestionBankDto dto) {
        return ResponseEntity.ok(questionBankService.createQuestionBank(dto));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<QuestionBankDto> updateQuestionBank(@PathVariable Long id, @RequestBody QuestionBankDto dto) {
        return ResponseEntity.ok(questionBankService.updateQuestionBank(id, dto));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteQuestionBank(@PathVariable Long id) {
        questionBankService.deleteQuestionBank(id);
        return ResponseEntity.noContent().build();
    }
}
