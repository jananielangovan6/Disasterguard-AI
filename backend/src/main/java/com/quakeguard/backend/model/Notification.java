package com.quakeguard.backend.model;

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

    @ManyToOne
    @JoinColumn(name = "recipient_id")
    private User recipient;

    @Enumerated(EnumType.STRING)
    private Role targetRole;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Notification() {}

    public Notification(String type, String title, String meta, User recipient, Role targetRole) {
        this.type = type;
        this.title = title;
        this.meta = meta;
        this.recipient = recipient;
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

    public User getRecipient() { return recipient; }
    public void setRecipient(User recipient) { this.recipient = recipient; }

    public Role getTargetRole() { return targetRole; }
    public void setTargetRole(Role targetRole) { this.targetRole = targetRole; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
