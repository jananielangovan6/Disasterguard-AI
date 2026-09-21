package com.quakeguard.notificationservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class NotificationServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(NotificationServiceApplication.class, args);
        System.out.println("==================================================");
        System.out.println("  Notification Microservice Started (Port 8084)   ");
        System.out.println("  H2 Console: http://localhost:8084/h2-console  ");
        System.out.println("==================================================");
    }
}
