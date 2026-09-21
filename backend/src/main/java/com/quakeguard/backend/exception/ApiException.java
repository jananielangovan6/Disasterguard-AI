package com.quakeguard.backend.exception;

public class ApiException extends RuntimeException {
    public ApiException(String message) {
        super(message);
    }
}
