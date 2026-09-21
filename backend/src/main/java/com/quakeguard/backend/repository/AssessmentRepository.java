package com.quakeguard.backend.repository;

import com.quakeguard.backend.model.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    List<Assessment> findAllByOrderByCreatedAtDesc();
    List<Assessment> findByAssignedEngineer_Id(Long engineerId);
    java.util.Optional<Assessment> findByBuildingCode(String buildingCode);
}
