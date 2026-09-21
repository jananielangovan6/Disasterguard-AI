package com.quakeguard.assessmentservice.repository;

import com.quakeguard.assessmentservice.model.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    List<Assessment> findAllByOrderByCreatedAtDesc();
    List<Assessment> findByAssignedEngineerId(Long assignedEngineerId);
}
