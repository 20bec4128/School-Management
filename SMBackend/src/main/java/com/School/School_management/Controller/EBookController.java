package com.School.School_management.Controller;

import com.School.School_management.Dto.EBookDto;
import com.School.School_management.Service.EBookService;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.auth.RequirePermission;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ebooks")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class EBookController {

    private final EBookService eBookService;
    private final ObjectMapper objectMapper;

    public EBookController(EBookService eBookService, ObjectMapper objectMapper) {
        this.eBookService = eBookService;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public Page<EBookDto> list(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String ebookType,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return eBookService.list(headOfficeId, schoolId, ebookType, classId, language, search, page, size, CurrentUserHolder.get());
    }

    @PostMapping(consumes = "multipart/form-data")
    public EBookDto create(
            @RequestPart("data") String data,
            @RequestPart(value = "ebookFile", required = false) MultipartFile ebookFile
    ) throws Exception {
        EBookDto dto = objectMapper.readValue(data, EBookDto.class);
        return eBookService.create(dto, ebookFile, CurrentUserHolder.get());
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public EBookDto update(
            @PathVariable Long id,
            @RequestPart("data") String data,
            @RequestPart(value = "ebookFile", required = false) MultipartFile ebookFile
    ) throws Exception {
        EBookDto dto = objectMapper.readValue(data, EBookDto.class);
        return eBookService.update(id, dto, ebookFile, CurrentUserHolder.get());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        eBookService.delete(id, CurrentUserHolder.get());
        return ResponseEntity.noContent().build();
    }
}
