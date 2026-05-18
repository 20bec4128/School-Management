package com.School.School_management.Exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class ScholarshipNotFoundException extends RuntimeException {

    public ScholarshipNotFoundException(Long id) {
        super("Scholarship not found with id: " + id);
    }
}

