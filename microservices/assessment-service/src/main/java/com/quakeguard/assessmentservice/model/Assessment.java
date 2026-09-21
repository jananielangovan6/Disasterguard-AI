package com.quakeguard.assessmentservice.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "assessment")
public class Assessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String buildingCode;
    private String buildingName;
    private String zone;

    private Double latitude;
    private Double longitude;

    private String severity;
    private Double riskScore;
    private Double aiConfidence;
    @Column(length = 1000)
    private String detectionNotes;
    private String recommendedAction;
    private String status;
    private String imageUrl;

    private Long inspectorId;
    private String inspectorName;

    private Long assignedEngineerId;
    private String assignedEngineerName;
    private String assignedBy;
    private String assignedDate;

    // Dual AI + Human Engineer Verification fields
    private boolean aiVerified = true;
    private boolean engineerVerified = false;
    private String engineerDecision;
    private String engineerRecommendation;
    @Column(length = 1000)
    private String engineerRemarks;
    private String reviewedBy;
    private String reviewDate;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Assessment() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBuildingCode() { return buildingCode; }
    public void setBuildingCode(String buildingCode) { this.buildingCode = buildingCode; }

    public String getBuildingName() { return buildingName; }
    public void setBuildingName(String buildingName) { this.buildingName = buildingName; }

    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public Double getRiskScore() { return riskScore; }
    public void setRiskScore(Double riskScore) { this.riskScore = riskScore; }

    public Double getAiConfidence() { return aiConfidence; }
    public void setAiConfidence(Double aiConfidence) { this.aiConfidence = aiConfidence; }

    public String getDetectionNotes() { return detectionNotes; }
    public void setDetectionNotes(String detectionNotes) { this.detectionNotes = detectionNotes; }

    public String getRecommendedAction() { return recommendedAction; }
    public void setRecommendedAction(String recommendedAction) { this.recommendedAction = recommendedAction; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Long getInspectorId() { return inspectorId; }
    public void setInspectorId(Long inspectorId) { this.inspectorId = inspectorId; }

    public String getInspectorName() { return inspectorName; }
    public void setInspectorName(String inspectorName) { this.inspectorName = inspectorName; }

    public Long getAssignedEngineerId() { return assignedEngineerId; }
    public void setAssignedEngineerId(Long assignedEngineerId) { this.assignedEngineerId = assignedEngineerId; }

    public String getAssignedEngineerName() { return assignedEngineerName; }
    public void setAssignedEngineerName(String assignedEngineerName) { this.assignedEngineerName = assignedEngineerName; }

    public String getAssignedBy() { return assignedBy; }
    public void setAssignedBy(String assignedBy) { this.assignedBy = assignedBy; }

    public String getAssignedDate() { return assignedDate; }
    public void setAssignedDate(String assignedDate) { this.assignedDate = assignedDate; }

    public boolean isAiVerified() { return aiVerified; }
    public void setAiVerified(boolean aiVerified) { this.aiVerified = aiVerified; }

    public boolean isEngineerVerified() { return engineerVerified; }
    public void setEngineerVerified(boolean engineerVerified) { this.engineerVerified = engineerVerified; }

    public String getEngineerDecision() { return engineerDecision; }
    public void setEngineerDecision(String engineerDecision) { this.engineerDecision = engineerDecision; }

    public String getEngineerRecommendation() { return engineerRecommendation; }
    public void setEngineerRecommendation(String engineerRecommendation) { this.engineerRecommendation = engineerRecommendation; }

    public String getEngineerRemarks() { return engineerRemarks; }
    public void setEngineerRemarks(String engineerRemarks) { this.engineerRemarks = engineerRemarks; }

    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }

    public String getReviewDate() { return reviewDate; }
    public void setReviewDate(String reviewDate) { this.reviewDate = reviewDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
