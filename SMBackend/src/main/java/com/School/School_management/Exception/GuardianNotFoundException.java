package com.School.School_management.Exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class GuardianNotFoundException extends RuntimeException {

    public GuardianNotFoundException(Long id) {
        super("Guardian not found with id: " + id);
    }
}

