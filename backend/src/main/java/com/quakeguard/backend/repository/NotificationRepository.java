package com.quakeguard.backend.repository;

import com.quakeguard.backend.model.Notification;
import com.quakeguard.backend.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n WHERE (n.recipient.id = :userId) OR (n.recipient IS NULL AND n.targetRole = :role) OR (n.recipient IS NULL AND n.targetRole IS NULL) ORDER BY n.createdAt DESC")
    List<Notification> findTargetedNotifications(@Param("userId") Long userId, @Param("role") Role role);
}
