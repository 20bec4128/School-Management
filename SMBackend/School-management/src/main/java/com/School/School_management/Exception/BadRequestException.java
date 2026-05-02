package com.School.School_management.Exception;

public class BadRequestException extends RuntimeException {
    public BadRequestException() {
        super("Bad request");
    }

    public BadRequestException(String message) {
        super(message);
    }
}
