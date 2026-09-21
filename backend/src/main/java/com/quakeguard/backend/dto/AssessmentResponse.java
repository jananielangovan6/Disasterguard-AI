package com.quakeguard.backend.dto;

import com.quakeguard.backend.model.Assessment;
import java.time.LocalDateTime;

public class AssessmentResponse {

    private Long id;
    private String buildingCode;
    private String buildingName;
    private String zone;
    private Double latitude;
    private Double longitude;
    private String severity;
    private Double riskScore;
    private Double aiConfidence;
    private String detectionNotes;
    private String recommendedAction;
    private String status;
    private String imageUrl;
    private String inspectorName;
    private String assignedEngineerName;
    private String assignedBy;
    private String assignedDate;
    private boolean aiVerified;
    private boolean engineerVerified;
    private String engineerDecision;
    private String engineerRecommendation;
    private String engineerRemarks;
    private String reviewedBy;
    private String reviewDate;

    // Repair Verification DTO Fields
    private String repairImageUrl;
    private String repairStatus;
    private String repairVerificationNotes;
    private LocalDateTime repairVerifiedAt;

    private LocalDateTime createdAt;

    public AssessmentResponse() {}

    public AssessmentResponse(Assessment a) {
        if (a == null) return;
        this.id = a.getId();
        this.buildingCode = a.getBuildingCode();
        this.buildingName = a.getBuildingName();
        this.zone = a.getZone();
        this.latitude = a.getLatitude();
        this.longitude = a.getLongitude();
        this.severity = a.getSeverity();
        this.riskScore = a.getRiskScore();
        this.aiConfidence = a.getAiConfidence();
        this.detectionNotes = a.getDetectionNotes();
        this.recommendedAction = a.getRecommendedAction();
        this.status = a.getStatus();
        this.imageUrl = a.getImageUrl();
        this.inspectorName = a.getInspectorName();
        this.assignedEngineerName = a.getAssignedEngineerName();
        this.assignedBy = a.getAssignedBy();
        this.assignedDate = a.getAssignedDate();
        this.aiVerified = a.isAiVerified();
        this.engineerVerified = a.isEngineerVerified();
        this.engineerDecision = a.getEngineerDecision();
        this.engineerRecommendation = a.getEngineerRecommendation();
        this.engineerRemarks = a.getEngineerRemarks();
        this.reviewedBy = a.getReviewedBy();
        this.reviewDate = a.getReviewDate();
        this.repairImageUrl = a.getRepairImageUrl();
        this.repairStatus = a.getRepairStatus();
        this.repairVerificationNotes = a.getRepairVerificationNotes();
        this.repairVerifiedAt = a.getRepairVerifiedAt();
        this.createdAt = a.getCreatedAt();
    }

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

    public String getInspectorName() { return inspectorName; }
    public void setInspectorName(String inspectorName) { this.inspectorName = inspectorName; }

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

    public String getRepairImageUrl() { return repairImageUrl; }
    public void setRepairImageUrl(String repairImageUrl) { this.repairImageUrl = repairImageUrl; }

    public String getRepairStatus() { return repairStatus; }
    public void setRepairStatus(String repairStatus) { this.repairStatus = repairStatus; }

    public String getRepairVerificationNotes() { return repairVerificationNotes; }
    public void setRepairVerificationNotes(String repairVerificationNotes) { this.repairVerificationNotes = repairVerificationNotes; }

    public LocalDateTime getRepairVerifiedAt() { return repairVerifiedAt; }
    public void setRepairVerifiedAt(LocalDateTime repairVerifiedAt) { this.repairVerifiedAt = repairVerifiedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
