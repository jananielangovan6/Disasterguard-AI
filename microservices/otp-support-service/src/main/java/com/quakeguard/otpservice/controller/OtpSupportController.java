package com.quakeguard.otpservice.controller;

import com.quakeguard.otpservice.model.OtpVerification;
import com.quakeguard.otpservice.model.SupportTicket;
import com.quakeguard.otpservice.repository.OtpVerificationRepository;
import com.quakeguard.otpservice.repository.SupportTicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@CrossOrigin(origins = "*")
public class OtpSupportController {

    @Autowired
    private OtpVerificationRepository otpRepository;

    @Autowired
    private SupportTicketRepository supportRepository;

    @PostMapping("/api/auth/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || !email.contains("@")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Valid email required."));
        }

        String otp = String.format("%06d", new Random().nextInt(1000000));
        OtpVerification verification = new OtpVerification(email.trim().toLowerCase(), otp, LocalDateTime.now().plusMinutes(10));
        otpRepository.save(verification);

        return ResponseEntity.ok(Map.of(
            "message", "Verification OTP sent to " + email,
            "otp", otp,
            "email", email.trim().toLowerCase()
        ));
    }

    @PostMapping("/api/auth/send-sms-otp")
    public ResponseEntity<?> sendSmsOtp(@RequestBody Map<String, String> body) {
        String phone = body.get("phone");
        String email = body.get("email");

        if (phone == null || phone.trim().replaceAll("\\D", "").length() < 10) {
            return ResponseEntity.badRequest().body(Map.of("message", "Valid 10-digit mobile number required for OTP."));
        }

        String cleanPhone = phone.replaceAll("\\D", "");
        if (cleanPhone.length() > 10) {
            cleanPhone = cleanPhone.substring(cleanPhone.length() - 10);
        }

        String otp = String.format("%06d", new Random().nextInt(1000000));
        String targetIdentifier = (email != null && email.contains("@")) ? email.trim().toLowerCase() : cleanPhone;

        OtpVerification verification = new OtpVerification(targetIdentifier, otp, LocalDateTime.now().plusMinutes(10));
        otpRepository.save(verification);

        if (!targetIdentifier.equals(cleanPhone)) {
            OtpVerification phoneVerification = new OtpVerification(cleanPhone, otp, LocalDateTime.now().plusMinutes(10));
            otpRepository.save(phoneVerification);
        }

        // Email & Phone OTP Dispatch Notification
        System.out.println("=================================================");
        System.out.println("OTP DISPATCHED TO CONCERNED EMAIL & PHONE -> " + targetIdentifier + " / +91 " + cleanPhone);
        System.out.println("MESSAGE: [DisasterGuard AI] Your Citizen OTP verification code is: " + otp + ". Valid for 10 minutes.");
        System.out.println("=================================================");

        return ResponseEntity.ok(Map.of(
            "message", "OTP sent to concerned email (" + targetIdentifier + ") and mobile +91 " + cleanPhone,
            "otp", otp,
            "phone", cleanPhone,
            "email", targetIdentifier,
            "smsSent", true
        ));
    }

    @PostMapping("/api/auth/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String phone = body.get("phone");
        String otp = body.get("otp");

        if ((email == null && phone == null) || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email/Phone and OTP required."));
        }

        String target = (email != null && !email.isBlank()) ? email.trim().toLowerCase() : phone.replaceAll("\\D", "");
        if (target.length() > 10 && !target.contains("@")) {
            target = target.substring(target.length() - 10);
        }

        Optional<OtpVerification> opt = otpRepository.findTopByEmailIgnoreCaseAndOtpOrderByExpiryTimeDesc(target, otp.trim());
        if (opt.isPresent() && opt.get().getExpiryTime().isAfter(LocalDateTime.now())) {
            OtpVerification v = opt.get();
            v.setVerified(true);
            otpRepository.save(v);
            return ResponseEntity.ok(Map.of("valid", true, "message", "SMS OTP verified successfully."));
        }

        return ResponseEntity.status(400).body(Map.of("valid", false, "message", "Incorrect or expired OTP code."));
    }

    @PostMapping("/api/auth/support-ticket")
    public ResponseEntity<?> submitSupportTicket(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String phone = body.get("phone");
        String message = body.get("message");

        if (name == null || email == null || message == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Name, email and message required."));
        }

        SupportTicket ticket = new SupportTicket(name.trim(), email.trim().toLowerCase(), phone != null ? phone.trim() : "", message.trim());
        supportRepository.save(ticket);

        return ResponseEntity.ok(Map.of("message", "Support ticket submitted.", "id", ticket.getId()));
    }

    @GetMapping("/api/support-tickets")
    public ResponseEntity<List<SupportTicket>> getAllTickets() {
        return ResponseEntity.ok(supportRepository.findAllByOrderBySubmittedAtDesc());
    }

    @PatchMapping("/api/support-tickets/{id}/status")
    public ResponseEntity<?> updateTicketStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<SupportTicket> opt = supportRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        SupportTicket t = opt.get();
        if (body.containsKey("status")) {
            t.setStatus(body.get("status").toUpperCase());
        }
        supportRepository.save(t);
        return ResponseEntity.ok(t);
    }

    @PostMapping("/api/auth/send-onboarding-email")
    public ResponseEntity<?> sendOnboardingEmail(@RequestBody Map<String, String> body) {
        String personalEmail = body.get("personalEmail");
        String officialEmail = body.get("officialEmail");
        String name = body.get("name");
        String role = body.get("role");

        if (personalEmail == null || !personalEmail.contains("@")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Valid personal email required."));
        }

        System.out.println("=================================================");
        System.out.println("ONBOARDING EMAIL DISPATCHED TO PERSONAL EMAIL -> " + personalEmail);
        System.out.println("TO: " + name + " <" + personalEmail + ">");
        System.out.println("SUBJECT: Welcome to DisasterGuard AI - Account Onboarding & Credentials");
        System.out.println("BODY: Hello " + name + ", you have been added to DisasterGuard AI as " + role + ".");
        System.out.println("Official Email Login: " + officialEmail);
        System.out.println("Default Password: demo123");
        System.out.println("=================================================");

        return ResponseEntity.ok(Map.of(
            "message", "Onboarding notification email sent to concerned personal email: " + personalEmail,
            "personalEmail", personalEmail,
            "officialEmail", officialEmail,
            "role", role
        ));
    }

    @PostMapping("/api/auth/send-deletion-email")
    public ResponseEntity<?> sendDeletionEmail(@RequestBody Map<String, String> body) {
        String personalEmail = body.get("personalEmail");
        String officialEmail = body.get("officialEmail");
        String name = body.get("name");
        String role = body.get("role");
        String action = body.get("action");
        String reason = body.get("reason");
        String assignedBy = body.get("assignedBy");

        String targetEmail = (personalEmail != null && personalEmail.contains("@")) ? personalEmail : officialEmail;

        System.out.println("=================================================");
        System.out.println("ACCOUNT " + (action != null ? action.toUpperCase() : "REMOVAL") + " EMAIL DISPATCHED TO PERSONAL ADDRESS -> " + targetEmail);
        System.out.println("TO: " + name + " <" + targetEmail + ">");
        System.out.println("SUBJECT: DisasterGuard AI Notice - Account " + ("deactivate".equalsIgnoreCase(action) ? "Deactivated" : "Removed"));
        System.out.println("BODY: Dear " + name + ",");
        System.out.println("Your DisasterGuard AI account (" + officialEmail + " | Role: " + role + ") has been " + ("deactivate".equalsIgnoreCase(action) ? "deactivated" : "removed") + " by Authority (" + (assignedBy != null ? assignedBy : "System Admin") + ").");
        System.out.println("REASON GIVEN BY AUTHORITY: " + reason);
        System.out.println("=================================================");

        return ResponseEntity.ok(Map.of(
            "message", "Deletion notification email sent to personal email: " + targetEmail,
            "personalEmail", targetEmail,
            "action", action != null ? action : "removed",
            "reason", reason != null ? reason : ""
        ));
    }
}
