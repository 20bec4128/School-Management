package com.School.School_management.Exception;

public class ForbiddenException extends RuntimeException {
    public ForbiddenException() {
        super("Forbidden");
    }

    public ForbiddenException(String message) {
        super(message);
    }
}

