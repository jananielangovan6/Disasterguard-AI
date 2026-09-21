package com.quakeguard.backend.config;

import com.quakeguard.backend.model.*;
import com.quakeguard.backend.repository.*;
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
    private AssessmentRepository assessmentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            System.out.println("Seeding database with default user accounts and domains...");

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
            System.out.println("User accounts seeded into database.");
        }

        if (assessmentRepository.count() == 0) {
            System.out.println("Seeding database with building assessments and dual verifications...");

            User janani = userRepository.findByEmailIgnoreCase("janani@disasterguard.org").orElse(null);
            User swetha = userRepository.findByEmailIgnoreCase("swetha@disasterguard.org").orElse(null);

            Assessment a1 = new Assessment();
            a1.setBuildingCode("B-042");
            a1.setBuildingName("Gandhi Nagar, Block C");
            a1.setZone("Zone A");
            a1.setSeverity("DESTROYED");
            a1.setRiskScore(97.2);
            a1.setAiConfidence(94.1);
            a1.setLatitude(10.9254);
            a1.setLongitude(76.9681);
            a1.setInspector(janani);
            a1.setInspectorName(janani != null ? janani.getFullName() : "Janani E");
            a1.setDetectionNotes("Partial column failure, diagonal shear cracks on 2nd floor facade spalling. Immediate evacuation recommended.");
            a1.setRecommendedAction("Immediate Evacuation");
            a1.setStatus("ENGINEER_REVIEWED");
            a1.setAssignedEngineer(swetha);
            a1.setAssignedEngineerName(swetha != null ? swetha.getFullName() : "Swetha S");
            a1.setAiVerified(true);
            a1.setEngineerVerified(true);
            a1.setEngineerDecision("APPROVE");
            a1.setEngineerRecommendation("Immediate Evacuation & Cordon Off");
            a1.setEngineerRemarks("Confirmed column structural instability. Structural integrity compromised beyond repair.");
            a1.setReviewedBy("Swetha S");
            a1.setReviewDate("12 Aug 2026, 09:10 AM");

            Assessment a2 = new Assessment();
            a2.setBuildingCode("B-017");
            a2.setBuildingName("Civil Lines");
            a2.setZone("Zone A");
            a2.setSeverity("DESTROYED");
            a2.setRiskScore(95.8);
            a2.setAiConfidence(91.4);
            a2.setLatitude(10.9280);
            a2.setLongitude(76.9720);
            a2.setInspector(janani);
            a2.setInspectorName("Janani E");
            a2.setDetectionNotes("Total roof collapse on west wing, foundation displacement observed.");
            a2.setRecommendedAction("Immediate Evacuation");
            a2.setStatus("URGENT");
            a2.setAssignedEngineer(swetha);
            a2.setAssignedEngineerName("Swetha S");
            a2.setAiVerified(true);
            a2.setEngineerVerified(false);

            assessmentRepository.saveAll(List.of(a1, a2));
            System.out.println("Building assessments seeded into database.");
        }

        if (notificationRepository.count() == 0) {
            User swetha = userRepository.findByEmailIgnoreCase("swetha@disasterguard.org").orElse(null);
            User janani = userRepository.findByEmailIgnoreCase("janani@disasterguard.org").orElse(null);

            Notification n1 = new Notification("critical", "Building B-042 classified as DESTROYED - Immediate action required", "12 Aug 2026, 09:15 AM | AI Assessment", null, Role.AUTHORITY);
            Notification n2 = new Notification("warning", "B-031 upgraded from Moderate to Severe after engineer override", "12 Aug 2026, 08:45 AM | Engineer Swetha S", swetha, Role.ENGINEER);
            Notification n3 = new Notification("success", "Upload confirmed: 5 images for B-038 received and queued for AI", "12 Aug 2026, 08:30 AM | System", janani, Role.FIELD_INSPECTOR);

            notificationRepository.saveAll(List.of(n1, n2, n3));
            System.out.println("Notifications seeded into database.");
        }
    }
}
