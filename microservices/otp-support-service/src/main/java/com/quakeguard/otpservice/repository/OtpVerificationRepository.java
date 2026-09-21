package com.quakeguard.otpservice.repository;

import com.quakeguard.otpservice.model.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findTopByEmailIgnoreCaseAndOtpOrderByExpiryTimeDesc(String email, String otp);
}
