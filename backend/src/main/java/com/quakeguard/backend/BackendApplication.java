package com.quakeguard.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
        System.out.println("==================================================");
        System.out.println("  QuakeGuard AI Database Backend Started (8080)   ");
        System.out.println("  H2 Console: http://localhost:8080/h2-console  ");
        System.out.println("==================================================");
    }
}
