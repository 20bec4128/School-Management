package com.School.School_management.Controller;

import com.School.School_management.Dto.CandidateDto;
import com.School.School_management.Dto.PaginationResponse;
import com.School.School_management.Service.CandidateService;
import com.School.School_management.auth.RequirePermission;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/candidates")
@RequirePermission({"CANDIDATE", "*"})
public class CandidateController {

    private final CandidateService candidateService;

    public CandidateController(CandidateService candidateService) {
        this.candidateService = candidateService;
    }

    @GetMapping
    public ResponseEntity<PaginationResponse<CandidateDto.Response>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long sectionId,
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(candidateService.getAll(page, size, headOfficeId, schoolId, classId, sectionId, academicYear, search));
    }

    @PostMapping
    public ResponseEntity<CandidateDto.Response> create(@RequestBody CandidateDto.Request request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(candidateService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CandidateDto.Response> update(
            @PathVariable Long id,
            @RequestBody CandidateDto.Request request) {
        return ResponseEntity.ok(candidateService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        candidateService.delete(id);
        return ResponseEntity.ok("Candidate deleted successfully");
    }
}
