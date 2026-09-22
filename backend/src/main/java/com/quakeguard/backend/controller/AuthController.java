package com.quakeguard.backend.controller;

import com.quakeguard.backend.dto.AuthResponse;
import com.quakeguard.backend.model.*;
import com.quakeguard.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(originPatterns = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpVerificationRepository otpRepository;

    @Autowired
    private SupportTicketRepository supportRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required."));
        }

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email.trim());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password."));
        }

        User user = userOpt.get();
        if ("INACTIVE".equalsIgnoreCase(user.getStatus())) {
            return ResponseEntity.status(403).body(Map.of("message", "Your account is deactivated. Contact admin."));
        }

        if (!passwordEncoder.matches(password, user.getPassword()) && !password.equals(user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password."));
        }

        String token = "jwt_token_" + user.getId() + "_" + System.currentTimeMillis();
        return ResponseEntity.ok(new AuthResponse(token, user.getId(), user.getFullName(), user.getEmail(), user.getRole().name()));
    }

    @GetMapping("/check-role")
    public ResponseEntity<?> checkRole(@RequestParam String email) {
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email.trim());
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(Map.of("role", userOpt.get().getRole().name()));
        }
        return ResponseEntity.ok(Map.of("role", "CITIZEN"));
    }

    @Autowired
    private org.springframework.mail.javamail.JavaMailSender mailSender;

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || !email.contains("@")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Valid email address is required."));
        }

        String targetEmail = email.trim().toLowerCase();
        String otp = body.get("otp");
        if (otp == null || otp.trim().isBlank()) {
            otp = String.format("%06d", new Random().nextInt(1000000));
        } else {
            otp = otp.trim();
        }
        OtpVerification verification = new OtpVerification(targetEmail, otp, LocalDateTime.now().plusMinutes(10));
        otpRepository.save(verification);

        // Send real Gmail email via Spring JavaMailSender directly to the target email from disasterguard26@gmail.com
        try {
            org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
            message.setFrom("disasterguard26@gmail.com");
            message.setTo(targetEmail);
            message.setSubject("DisasterGuard AI — Citizen OTP Verification Code: " + otp);
            message.setText("Dear Citizen,\n\nYour 6-digit Verification OTP Code for DisasterGuard AI is: " + otp + "\n\nPlease enter this 6-digit verification code on the DisasterGuard AI screen to activate/verify your account.\n\nBest regards,\nDisasterGuard AI Response Team\nFrom: disasterguard26@gmail.com");
            mailSender.send(message);
            System.out.println("✅ Real Gmail OTP Email sent successfully to " + targetEmail);
        } catch (Exception e) {
            System.err.println("⚠️ Gmail SMTP Email dispatch error: " + e.getMessage());
            e.printStackTrace();
        }

        return ResponseEntity.ok(Map.of(
            "message", "Verification OTP sent to " + targetEmail,
            "otp", otp,
            "email", targetEmail
        ));
    }

    @GetMapping("/test-smtp")
    public ResponseEntity<?> testSmtp(@RequestParam(defaultValue = "disasterguard26@gmail.com") String to) {
        try {
            org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
            message.setFrom("disasterguard26@gmail.com");
            message.setTo(to.trim());
            message.setSubject("DisasterGuard AI — SMTP Health Check Verification Test");
            message.setText("Hello! This is a test email sent from DisasterGuard AI Spring Boot Backend using Gmail SMTP (smtp.gmail.com:587) to verify real email delivery.");
            mailSender.send(message);
            System.out.println("✅ SMTP Health Check: Real Gmail Email sent successfully to " + to);
            return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "SMTP Email sent successfully to " + to));
        } catch (Exception e) {
            System.err.println("❌ SMTP Health Check Error: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("status", "ERROR", "error", e.getMessage(), "cause", e.toString()));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");

        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and OTP code are required."));
        }

        Optional<OtpVerification> opt = otpRepository.findTopByEmailIgnoreCaseAndOtpOrderByExpiryTimeDesc(email.trim(), otp.trim());
        if (opt.isPresent() && opt.get().getExpiryTime().isAfter(LocalDateTime.now())) {
            OtpVerification v = opt.get();
            v.setVerified(true);
            otpRepository.save(v);
            return ResponseEntity.ok(Map.of("valid", true, "message", "OTP code verified successfully."));
        }

        return ResponseEntity.status(400).body(Map.of("valid", false, "message", "Incorrect or expired OTP code."));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String, String> body) {
        String fullName = body.get("fullName");
        String email = body.get("email");
        String phone = body.get("phone");
        String password = body.get("password");
        String roleStr = body.getOrDefault("role", "CITIZEN");

        if (fullName == null || email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Full name, email, and password are required."));
        }

        if (userRepository.existsByEmailIgnoreCase(email.trim())) {
            return ResponseEntity.badRequest().body(Map.of("message", "An account with this email already exists."));
        }

        Role role = Role.CITIZEN;
        try { role = Role.valueOf(roleStr.toUpperCase()); } catch (Exception ignored) {}

        User newUser = new User(fullName.trim(), email.trim().toLowerCase(), phone != null ? phone.trim() : "", passwordEncoder.encode(password), role);
        userRepository.save(newUser);

        String token = "jwt_token_" + newUser.getId() + "_" + System.currentTimeMillis();
        return ResponseEntity.ok(new AuthResponse(token, newUser.getId(), newUser.getFullName(), newUser.getEmail(), newUser.getRole().name()));
    }

    @PostMapping("/support-ticket")
    public ResponseEntity<?> submitSupportTicket(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String phone = body.get("phone");
        String message = body.get("message");

        if (name == null || email == null || message == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Name, email and message are required."));
        }

        SupportTicket ticket = new SupportTicket(name.trim(), email.trim().toLowerCase(), phone != null ? phone.trim() : "", message.trim());
        supportRepository.save(ticket);

        return ResponseEntity.ok(Map.of("message", "Support ticket submitted successfully.", "id", ticket.getId()));
    }

    @GetMapping("/admin-contacts")
    public ResponseEntity<?> getAdminContacts() {
        List<User> admins = userRepository.findByRole(Role.AUTHORITY);
        List<Map<String, String>> list = new ArrayList<>();
        for (User u : admins) {
            list.add(Map.of(
                "fullName", u.getFullName(),
                "email", u.getEmail(),
                "phone", u.getPhone() != null ? u.getPhone() : "+91 98765 43210"
            ));
        }
        return ResponseEntity.ok(list);
    }
}
