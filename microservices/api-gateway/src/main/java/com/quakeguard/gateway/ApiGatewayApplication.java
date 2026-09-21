package com.quakeguard.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class ApiGatewayApplication {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
        System.out.println("==========================================================");
        System.out.println("  QuakeGuard AI API Gateway Router Started (Port 8080)    ");
        System.out.println("  Routing HTTP traffic to 4 Microservices:                ");
        System.out.println("  - user-service:         http://localhost:8081           ");
        System.out.println("  - otp-support-service:  http://localhost:8082           ");
        System.out.println("  - assessment-service:   http://localhost:8083           ");
        System.out.println("  - notification-service: http://localhost:8084           ");
        System.out.println("==========================================================");
    }
}
