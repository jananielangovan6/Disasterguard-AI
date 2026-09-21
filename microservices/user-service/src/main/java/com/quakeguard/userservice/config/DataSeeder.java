package com.quakeguard.userservice.config;

import com.quakeguard.userservice.model.Role;
import com.quakeguard.userservice.model.User;
import com.quakeguard.userservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            User u1 = new User("Janani E", "janani@disasterguard.org", "+91 98401 23456", passwordEncoder.encode("demo123"), Role.FIELD_INSPECTOR);
            u1.setDesignation("Lead Inspector"); u1.setZone("Zone A");

            User u2 = new User("Swetha S", "swetha@disasterguard.org", "+91 94440 12345", passwordEncoder.encode("demo123"), Role.ENGINEER);
            u2.setDesignation("Senior Structural Engineer"); u2.setSpecialization("Seismic Retrofitting"); u2.setZone("Zone B");

            User u3 = new User("Dhiyana M", "dhiyana@disasterguard.org", "+91 97902 34567", passwordEncoder.encode("demo123"), Role.FIELD_INSPECTOR);
            u3.setDesignation("Field Surveyor"); u3.setZone("Zone C");

            User u4 = new User("Rajan K", "admin@disasterguard.org", "+91 98765 43210", passwordEncoder.encode("demo123"), Role.AUTHORITY);
            u4.setDesignation("Disaster Response Director"); u4.setZone("Headquarters");

            User u5 = new User("Karthik R", "karthik@disasterguard.org", "+91 96001 87654", passwordEncoder.encode("demo123"), Role.ENGINEER);
            u5.setDesignation("Structural Specialist"); u5.setZone("Zone D");

            userRepository.saveAll(List.of(u1, u2, u3, u4, u5));
            System.out.println("user-service database seeded with 5 default user accounts.");
        }
    }
}
