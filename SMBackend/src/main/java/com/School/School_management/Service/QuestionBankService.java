package com.School.School_management.Service;

import com.School.School_management.Dto.QuestionBankDto;
import java.util.Map;

public interface QuestionBankService {
    Map<String, Object> getQuestionBanksPage(Long schoolId, Long classId, Long subjectId, String questionType, String questionLevel, String status, int page, int size, String search);
    QuestionBankDto createQuestionBank(QuestionBankDto dto);
    QuestionBankDto updateQuestionBank(Long id, QuestionBankDto dto);
    void deleteQuestionBank(Long id);
}
