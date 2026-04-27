// com/School/School_management/Exception/StudentActivityNotFoundException.java
package com.School.School_management.Exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class StudentActivityNotFoundException extends RuntimeException {
    
    public StudentActivityNotFoundException(Long id) {
        super("Student activity not found with id: " + id);
    }
}