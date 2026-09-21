package com.quakeguard.notificationservice.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type = "info";
    private String title;
    private String meta;
    private boolean readState = false;

    private Long recipientId;
    private String targetRole;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Notification() {}

    public Notification(String type, String title, String meta, Long recipientId, String targetRole) {
        this.type = type;
        this.title = title;
        this.meta = meta;
        this.recipientId = recipientId;
        this.targetRole = targetRole;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMeta() { return meta; }
    public void setMeta(String meta) { this.meta = meta; }

    public boolean isReadState() { return readState; }
    public void setReadState(boolean readState) { this.readState = readState; }

    public Long getRecipientId() { return recipientId; }
    public void setRecipientId(Long recipientId) { this.recipientId = recipientId; }

    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
