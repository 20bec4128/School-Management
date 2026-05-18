package com.School.School_management.Controller;

import com.School.School_management.Dto.SuggestionDto;
import com.School.School_management.Service.SuggestionService;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.auth.RequirePermission;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/suggestions")
@CrossOrigin(
        originPatterns = {
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://school.infitoolz.com",
                "http://school.infitoolz.com"
        },
        allowCredentials = "true"
)
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class SuggestionController {

    private final SuggestionService suggestionService;

    public SuggestionController(SuggestionService suggestionService) {
        this.suggestionService = suggestionService;
    }

    @GetMapping
    public List<SuggestionDto> list(
            @RequestParam(name = "headOfficeId", required = false) Long headOfficeId,
            @RequestParam(name = "schoolId", required = false) Long schoolId,
            @RequestParam(name = "examTerm", required = false) String examTerm,
            @RequestParam(name = "className", required = false) String className,
            @RequestParam(name = "subjectName", required = false) String subjectName,
            @RequestParam(name = "search", required = false) String search
    ) {
        return suggestionService.list(headOfficeId, schoolId, examTerm, className, subjectName, search, CurrentUserHolder.get());
    }

    @GetMapping("/page")
    public ResponseEntity<Page<SuggestionDto>> listPaginated(
            @RequestParam(name = "headOfficeId", required = false) Long headOfficeId,
            @RequestParam(name = "schoolId", required = false) Long schoolId,
            @RequestParam(name = "examTerm", required = false) String examTerm,
            @RequestParam(name = "className", required = false) String className,
            @RequestParam(name = "subjectName", required = false) String subjectName,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(
                suggestionService.listPaginated(headOfficeId, schoolId, examTerm, className, subjectName, search, page, size, CurrentUserHolder.get())
        );
    }

    @GetMapping("/{id}")
    public SuggestionDto getById(@PathVariable Long id) {
        return suggestionService.getById(id, CurrentUserHolder.get());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public SuggestionDto create(
            @RequestParam(name = "headOfficeId", required = false) Long headOfficeId,
            @RequestParam(name = "schoolId") Long schoolId,
            @RequestParam(name = "title") String title,
            @RequestParam(name = "examTerm") String examTerm,
            @RequestParam(name = "className") String className,
            @RequestParam(name = "subjectName") String subjectName,
            @RequestParam(name = "suggestionText") String suggestionText,
            @RequestParam(name = "removeDocument", required = false) Boolean removeDocument,
            @RequestParam(name = "note", required = false) String note,
            @RequestParam(name = "document", required = false) MultipartFile document
    ) {
        SuggestionDto dto = new SuggestionDto();
        dto.setHeadOfficeId(headOfficeId);
        dto.setSchoolId(schoolId);
        dto.setTitle(title);
        dto.setExamTerm(examTerm);
        dto.setClassName(className);
        dto.setSubjectName(subjectName);
        dto.setSuggestionText(suggestionText);
        dto.setRemoveDocument(removeDocument);
        dto.setNote(note);
        return suggestionService.create(dto, document, CurrentUserHolder.get());
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public SuggestionDto update(
            @PathVariable Long id,
            @RequestParam(name = "headOfficeId", required = false) Long headOfficeId,
            @RequestParam(name = "schoolId") Long schoolId,
            @RequestParam(name = "title") String title,
            @RequestParam(name = "examTerm") String examTerm,
            @RequestParam(name = "className") String className,
            @RequestParam(name = "subjectName") String subjectName,
            @RequestParam(name = "suggestionText") String suggestionText,
            @RequestParam(name = "removeDocument", required = false) Boolean removeDocument,
            @RequestParam(name = "note", required = false) String note,
            @RequestParam(name = "document", required = false) MultipartFile document
    ) {
        SuggestionDto dto = new SuggestionDto();
        dto.setHeadOfficeId(headOfficeId);
        dto.setSchoolId(schoolId);
        dto.setTitle(title);
        dto.setExamTerm(examTerm);
        dto.setClassName(className);
        dto.setSubjectName(subjectName);
        dto.setSuggestionText(suggestionText);
        dto.setRemoveDocument(removeDocument);
        dto.setNote(note);
        return suggestionService.update(id, dto, document, CurrentUserHolder.get());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        suggestionService.delete(id, CurrentUserHolder.get());
        return ResponseEntity.noContent().build();
    }
}
