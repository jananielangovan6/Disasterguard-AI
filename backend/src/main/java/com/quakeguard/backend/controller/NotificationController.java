package com.quakeguard.backend.controller;

import com.quakeguard.backend.model.Notification;
import com.quakeguard.backend.model.Role;
import com.quakeguard.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(originPatterns = "*")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(@RequestParam(required = false) Long userId, @RequestParam(required = false) String role) {
        Role roleEnum = null;
        if (role != null) {
            try { roleEnum = Role.valueOf(role.toUpperCase()); } catch (Exception ignored) {}
        }
        if (userId != null && roleEnum != null) {
            return ResponseEntity.ok(notificationRepository.findTargetedNotifications(userId, roleEnum));
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
