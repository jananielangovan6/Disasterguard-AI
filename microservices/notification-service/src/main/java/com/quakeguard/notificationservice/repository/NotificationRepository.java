package com.quakeguard.notificationservice.repository;

import com.quakeguard.notificationservice.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n WHERE (n.recipientId = :userId) OR (n.recipientId IS NULL AND n.targetRole = :role) OR (n.recipientId IS NULL AND n.targetRole IS NULL) ORDER BY n.createdAt DESC")
    List<Notification> findTargetedNotifications(@Param("userId") Long userId, @Param("role") String role);
}
