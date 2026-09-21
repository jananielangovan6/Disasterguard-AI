package com.quakeguard.backend.repository;

import com.quakeguard.backend.model.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findTopByEmailIgnoreCaseOrderByExpiryTimeDesc(String email);
    Optional<OtpVerification> findTopByEmailIgnoreCaseAndOtpOrderByExpiryTimeDesc(String email, String otp);
}
