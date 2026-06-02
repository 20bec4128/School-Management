package com.School.School_management.Controller;

import com.School.School_management.Dto.BookDto;
import com.School.School_management.Service.BookService;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.auth.RequirePagePermission;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/books")
@RequirePagePermission(slug = "book", action = "view")
public class BookController {

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @GetMapping
    public Page<BookDto> list(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) String edition,
            @RequestParam(required = false) String almiraNo,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return bookService.list(headOfficeId, schoolId, language, edition, almiraNo, search, page, size, CurrentUserHolder.get());
    }

    @PostMapping
    @RequirePagePermission(slug = "book", action = "add")
    public BookDto create(@RequestBody BookDto dto) {
        return bookService.create(dto, CurrentUserHolder.get());
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "book", action = "edit")
    public BookDto update(@PathVariable Long id, @RequestBody BookDto dto) {
        return bookService.update(id, dto, CurrentUserHolder.get());
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "book", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        bookService.delete(id, CurrentUserHolder.get());
        return ResponseEntity.noContent().build();
    }
}
