package com.quakeguard.notificationservice.config;

import com.quakeguard.notificationservice.model.Notification;
import com.quakeguard.notificationservice.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private NotificationRepository notificationRepository;

    @Override
    public void run(String... args) {
        if (notificationRepository.count() == 0) {
            Notification n1 = new Notification("critical", "Building B-042 classified as DESTROYED - Immediate action required", "12 Aug 2026, 09:15 AM | AI Assessment", null, "AUTHORITY");
            Notification n2 = new Notification("warning", "B-031 upgraded from Moderate to Severe after engineer override", "12 Aug 2026, 08:45 AM | Engineer Swetha S", 2L, "ENGINEER");
            Notification n3 = new Notification("success", "Upload confirmed: 5 images for B-038 received and queued for AI", "12 Aug 2026, 08:30 AM | System", 1L, "FIELD_INSPECTOR");

            notificationRepository.saveAll(List.of(n1, n2, n3));
            System.out.println("notification-service database seeded with default notifications.");
        }
    }
}
