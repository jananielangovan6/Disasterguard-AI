package com.quakeguard.assessmentservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AssessmentServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AssessmentServiceApplication.class, args);
        System.out.println("==================================================");
        System.out.println("  Assessment Microservice Started (Port 8083)     ");
        System.out.println("  H2 Console: http://localhost:8083/h2-console  ");
        System.out.println("==================================================");
    }
}
