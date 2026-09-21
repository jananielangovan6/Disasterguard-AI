package com.quakeguard.notificationservice.controller;

import com.quakeguard.notificationservice.model.Notification;
import com.quakeguard.notificationservice.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(@RequestParam(required = false) Long userId, @RequestParam(required = false) String role) {
        if (userId != null && role != null) {
            return ResponseEntity.ok(notificationRepository.findTargetedNotifications(userId, role.toUpperCase()));
        }
        return ResponseEntity.ok(notificationRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> createNotification(@RequestBody Notification notification) {
        Notification saved = notificationRepository.save(notification);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllRead() {
        List<Notification> list = notificationRepository.findAll();
        for (Notification n : list) {
            n.setReadState(true);
        }
        notificationRepository.saveAll(list);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read."));
    }
}
