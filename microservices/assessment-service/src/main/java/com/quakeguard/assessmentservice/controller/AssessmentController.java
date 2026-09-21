package com.quakeguard.assessmentservice.controller;

import com.quakeguard.assessmentservice.model.Assessment;
import com.quakeguard.assessmentservice.repository.AssessmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/assessments")
@CrossOrigin(origins = "*")
public class AssessmentController {

    @Autowired
    private AssessmentRepository assessmentRepository;

    @GetMapping
    public ResponseEntity<List<Assessment>> getAllAssessments() {
        return ResponseEntity.ok(assessmentRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAssessmentById(@PathVariable Long id) {
        Optional<Assessment> opt = assessmentRepository.findById(id);
        if (opt.isPresent()) return ResponseEntity.ok(opt.get());
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<?> createAssessment(@RequestBody Assessment assessment) {
        Assessment saved = assessmentRepository.save(assessment);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<?> assignEngineer(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Optional<Assessment> opt = assessmentRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Assessment a = opt.get();
        Object engineerIdObj = body.get("engineerId");
        if (engineerIdObj != null) {
            try {
                Long engineerId = Long.parseLong(engineerIdObj.toString().replace("u", ""));
                
                // Enforce constraint: 1 engineer can only be assigned to 1 active building assessment
                List<Assessment> allAssessments = assessmentRepository.findAll();
                boolean alreadyAssigned = allAssessments.stream().anyMatch(existing -> 
                    !existing.getId().equals(id) &&
                    engineerId.equals(existing.getAssignedEngineerId()) &&
                    !"ENGINEER_REVIEWED".equalsIgnoreCase(existing.getStatus()) &&
                    !"COMPLETED".equalsIgnoreCase(existing.getStatus())
                );

                if (alreadyAssigned) {
                    return ResponseEntity.badRequest().body(Map.of("message", "This engineer is already assigned to another building. Each engineer can only be assigned to 1 building at a time."));
                }

                a.setAssignedEngineerId(engineerId);
            } catch (Exception ignored) {}
        }
        if (body.containsKey("assignedBy")) a.setAssignedBy(body.get("assignedBy").toString());
        a.setStatus("PROCESSING");
        a.setAssignedDate(java.time.LocalDateTime.now().toString());

        assessmentRepository.save(a);
        return ResponseEntity.ok(a);
    }

    @PatchMapping("/{id}/review")
    public ResponseEntity<?> submitEngineerReview(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<Assessment> opt = assessmentRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Assessment a = opt.get();
        if (body.containsKey("severity")) a.setSeverity(body.get("severity"));
        if (body.containsKey("engineerDecision")) a.setEngineerDecision(body.get("engineerDecision"));
        if (body.containsKey("engineerRecommendation")) a.setEngineerRecommendation(body.get("engineerRecommendation"));
        if (body.containsKey("engineerRemarks")) a.setEngineerRemarks(body.get("engineerRemarks"));
        if (body.containsKey("reviewedBy")) a.setReviewedBy(body.get("reviewedBy"));
        if (body.containsKey("reviewDate")) a.setReviewDate(body.get("reviewDate"));
        
        a.setEngineerVerified(true);
        a.setStatus("ENGINEER_REVIEWED");

        assessmentRepository.save(a);
        return ResponseEntity.ok(a);
    }
}
