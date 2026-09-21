package com.quakeguard.otpservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OtpSupportServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(OtpSupportServiceApplication.class, args);
        System.out.println("==================================================");
        System.out.println("  OTP & Support Microservice Started (Port 8082)  ");
        System.out.println("  H2 Console: http://localhost:8082/h2-console  ");
        System.out.println("==================================================");
    }
}
