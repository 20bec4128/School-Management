package com.School.School_management.Exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class StudentTypeNotFoundException extends RuntimeException {

    public StudentTypeNotFoundException(Long id) {
        super("Student type not found with id: " + id);
    }
}