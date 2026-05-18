package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.QuestionBankDto;
import com.School.School_management.Entity.*;
import com.School.School_management.Repository.*;
import com.School.School_management.Service.QuestionBankService;
import java.util.Collections;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class QuestionBankServiceImpl implements QuestionBankService {

    @Autowired
    private QuestionBankRepository questionBankRepository;

    @Autowired
    private SchoolRepository schoolRepository;

    @Autowired
    private SchoolClassRepository classRepository;

    @Autowired
    private SchoolSectionRepository sectionRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Override
    public Map<String, Object> getQuestionBanksPage(Long headOfficeId, Long schoolId, Long classId, Long subjectId, String questionType, String questionLevel, String status, int page, int size, String search) {
        List<QuestionBank> all;
        if (schoolId != null) {
            all = questionBankRepository.findBySchool_IdAndDeletedFalseOrderByIdDesc(schoolId);
        } else if (headOfficeId != null) {
            all = questionBankRepository.findBySchool_HeadOfficeIdAndDeletedFalseOrderByIdDesc(headOfficeId);
        } else {
            all = questionBankRepository.findAllByDeletedFalseOrderByIdDesc();
        }

        String q = (search != null) ? search.toLowerCase() : "";
        List<QuestionBankDto> filtered = all.stream()
                .filter(e -> {
                    boolean matches = true;
                    if (classId != null && (e.getSchoolClass() == null || !e.getSchoolClass().getId().equals(classId))) matches = false;
                    if (subjectId != null && (e.getSubject() == null || !e.getSubject().getId().equals(subjectId))) matches = false;
                    if (questionType != null && !questionType.equals("Select") && (e.getQuestionType() == null || !e.getQuestionType().equalsIgnoreCase(questionType))) matches = false;
                    if (questionLevel != null && !questionLevel.equals("Select") && (e.getQuestionLevel() == null || !e.getQuestionLevel().equalsIgnoreCase(questionLevel))) matches = false;
                    if (status != null && !status.equals("Select") && (e.getStatus() == null || !e.getStatus().equalsIgnoreCase(status))) matches = false;
                    
                    if (matches && !q.isEmpty()) {
                        String content = String.join(" ",
                                String.valueOf(e.getQuestion() == null ? "" : e.getQuestion()),
                                String.valueOf(e.getSchool() == null ? "" : e.getSchool().getSchoolName()),
                                String.valueOf(e.getSchoolClass() == null ? "" : e.getSchoolClass().getClassName())
                        ).toLowerCase();
                        if (!content.contains(q)) matches = false;
                    }
                    return matches;
                })
                .map(this::toDto)
                .collect(Collectors.toList());

        int totalElements = filtered.size();
        int fromIndex = page * size;
        int toIndex = Math.min(fromIndex + size, totalElements);

        List<QuestionBankDto> content = (fromIndex < totalElements) ? filtered.subList(fromIndex, toIndex) : Collections.emptyList();

        Map<String, Object> response = new HashMap<>();
        response.put("content", content);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));
        response.put("size", size);
        response.put("number", page);

        return response;
    }

    @Override
    @Transactional
    public QuestionBankDto createQuestionBank(QuestionBankDto dto) {
        QuestionBank entity = new QuestionBank();
        copyProperties(dto, entity);
        QuestionBank saved = questionBankRepository.save(entity);
        return toDto(saved);
    }

    @Override
    @Transactional
    public QuestionBankDto updateQuestionBank(Long id, QuestionBankDto dto) {
        QuestionBank entity = questionBankRepository.findById(id).orElseThrow(() -> new RuntimeException("QuestionBank not found"));
        copyProperties(dto, entity);
        QuestionBank saved = questionBankRepository.save(entity);
        return toDto(saved);
    }

    @Override
    @Transactional
    public void deleteQuestionBank(Long id) {
        QuestionBank entity = questionBankRepository.findById(id).orElseThrow(() -> new RuntimeException("QuestionBank not found"));
        entity.setDeleted(true);
        questionBankRepository.save(entity);
    }

    private void copyProperties(QuestionBankDto dto, QuestionBank entity) {
        entity.setSchool(schoolRepository.findById(dto.getSchoolId()).orElseThrow(() -> new RuntimeException("School not found")));
        entity.setSchoolClass(classRepository.findById(dto.getClassId()).orElseThrow(() -> new RuntimeException("Class not found")));
        if (dto.getSectionId() != null) {
            entity.setSection(sectionRepository.findById(dto.getSectionId()).orElse(null));
        }
        entity.setSubject(subjectRepository.findById(dto.getSubjectId()).orElseThrow(() -> new RuntimeException("Subject not found")));
        entity.setQuestionLevel(dto.getQuestionLevel());
        entity.setQuestion(dto.getQuestion());
        entity.setImagePath(dto.getImagePath());
        entity.setDocumentPath(dto.getDocumentPath());
        entity.setMark(dto.getMark());
        entity.setQuestionType(dto.getQuestionType());
        if (dto.getStatus() != null) entity.setStatus(dto.getStatus());
    }

    private QuestionBankDto toDto(QuestionBank entity) {
        QuestionBankDto dto = new QuestionBankDto();
        dto.setId(entity.getId());
        if (entity.getSchool() != null) {
            dto.setSchoolId(entity.getSchool().getId());
            dto.setSchoolName(entity.getSchool().getSchoolName());
        }
        if (entity.getSchoolClass() != null) {
            dto.setClassId(entity.getSchoolClass().getId());
            dto.setClassName(entity.getSchoolClass().getClassName());
        }
        if (entity.getSection() != null) {
            dto.setSectionId(entity.getSection().getId());
            dto.setSectionName(entity.getSection().getName());
        }
        if (entity.getSubject() != null) {
            dto.setSubjectId(entity.getSubject().getId());
            dto.setSubjectName(entity.getSubject().getName());
        }
        dto.setQuestionLevel(entity.getQuestionLevel());
        dto.setQuestion(entity.getQuestion());
        dto.setImagePath(entity.getImagePath());
        dto.setDocumentPath(entity.getDocumentPath());
        dto.setMark(entity.getMark());
        dto.setQuestionType(entity.getQuestionType());
        dto.setStatus(entity.getStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
