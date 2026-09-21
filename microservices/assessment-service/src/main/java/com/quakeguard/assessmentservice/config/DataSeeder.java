package com.quakeguard.assessmentservice.config;

import com.quakeguard.assessmentservice.model.Assessment;
import com.quakeguard.assessmentservice.repository.AssessmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Override
    public void run(String... args) {
        if (assessmentRepository.count() == 0) {
            Assessment a1 = new Assessment();
            a1.setBuildingCode("B-042");
            a1.setBuildingName("Gandhi Nagar, Block C");
            a1.setZone("Zone A");
            a1.setSeverity("DESTROYED");
            a1.setRiskScore(97.2);
            a1.setAiConfidence(94.1);
            a1.setLatitude(10.9254);
            a1.setLongitude(76.9681);
            a1.setInspectorName("Janani E");
            a1.setDetectionNotes("Partial column failure, diagonal shear cracks on 2nd floor facade spalling. Immediate evacuation recommended.");
            a1.setRecommendedAction("Immediate Evacuation");
            a1.setStatus("ENGINEER_REVIEWED");
            a1.setAssignedEngineerName("Swetha S");
            a1.setAiVerified(true);
            a1.setEngineerVerified(true);
            a1.setEngineerDecision("APPROVE");
            a1.setEngineerRecommendation("Immediate Evacuation & Cordon Off");
            a1.setEngineerRemarks("Confirmed column structural instability. Structural integrity compromised beyond repair.");
            a1.setReviewedBy("Swetha S");
            a1.setReviewDate("12 Aug 2026, 09:10 AM");

            Assessment a2 = new Assessment();
            a2.setBuildingCode("B-017");
            a2.setBuildingName("Civil Lines");
            a2.setZone("Zone A");
            a2.setSeverity("DESTROYED");
            a2.setRiskScore(95.8);
            a2.setAiConfidence(91.4);
            a2.setLatitude(10.9280);
            a2.setLongitude(76.9720);
            a2.setInspectorName("Janani E");
            a2.setDetectionNotes("Total roof collapse on west wing, foundation displacement observed.");
            a2.setRecommendedAction("Immediate Evacuation");
            a2.setStatus("URGENT");
            a2.setAssignedEngineerName("Swetha S");
            a2.setAiVerified(true);
            a2.setEngineerVerified(false);

            assessmentRepository.saveAll(List.of(a1, a2));
            System.out.println("assessment-service database seeded with default building assessments.");
        }
    }
}
