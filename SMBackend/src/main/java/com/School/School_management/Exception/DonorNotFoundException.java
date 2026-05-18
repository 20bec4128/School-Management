package com.School.School_management.Exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class DonorNotFoundException extends RuntimeException {

    public DonorNotFoundException(Long id) {
        super("Donor not found with id: " + id);
    }
}

