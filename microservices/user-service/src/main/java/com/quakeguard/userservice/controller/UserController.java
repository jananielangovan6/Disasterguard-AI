package com.quakeguard.userservice.controller;

import com.quakeguard.userservice.dto.AuthResponse;
import com.quakeguard.userservice.model.Role;
import com.quakeguard.userservice.model.User;
import com.quakeguard.userservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/api/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password required."));
        }

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email.trim());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password."));
        }

        User user = userOpt.get();
        if ("INACTIVE".equalsIgnoreCase(user.getStatus())) {
            return ResponseEntity.status(403).body(Map.of("message", "Account deactivated. Contact admin."));
        }

        if (!passwordEncoder.matches(password, user.getPassword()) && !password.equals(user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password."));
        }

        String token = "jwt_token_" + user.getId() + "_" + System.currentTimeMillis();
        return ResponseEntity.ok(new AuthResponse(token, user.getId(), user.getFullName(), user.getEmail(), user.getRole().name()));
    }

    @GetMapping("/api/auth/check-role")
    public ResponseEntity<?> checkRole(@RequestParam String email) {
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email.trim());
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(Map.of("role", userOpt.get().getRole().name()));
        }
        return ResponseEntity.ok(Map.of("role", "CITIZEN"));
    }

    @PostMapping("/api/auth/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String, String> body) {
        String fullName = body.get("fullName");
        String email = body.get("email");
        String phone = body.get("phone");
        String password = body.get("password");

        if (fullName == null || email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Full name, email, and password required."));
        }

        if (userRepository.existsByEmailIgnoreCase(email.trim())) {
            return ResponseEntity.badRequest().body(Map.of("message", "An account with this email already exists."));
        }

        User newUser = new User(fullName.trim(), email.trim().toLowerCase(), phone != null ? phone.trim() : "", passwordEncoder.encode(password), Role.CITIZEN);
        userRepository.save(newUser);

        String token = "jwt_token_" + newUser.getId() + "_" + System.currentTimeMillis();
        return ResponseEntity.ok(new AuthResponse(token, newUser.getId(), newUser.getFullName(), newUser.getEmail(), newUser.getRole().name()));
    }

    @GetMapping("/api/auth/admin-contacts")
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

    @GetMapping("/api/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/api/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        Optional<User> u = userRepository.findById(id);
        if (u.isPresent()) return ResponseEntity.ok(u.get());
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/api/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> body) {
        String fullName = body.get("fullName");
        String email = body.get("email");
        String phone = body.get("phone");
        String roleStr = body.get("role");

        if (fullName == null || email == null || phone == null || roleStr == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Full name, email, phone, and role are required."));
        }

        if (userRepository.existsByEmailIgnoreCase(email.trim())) {
            return ResponseEntity.badRequest().body(Map.of("message", "User with this email already exists."));
        }

        Role role = Role.FIELD_INSPECTOR;
        try { role = Role.valueOf(roleStr.toUpperCase()); } catch (Exception ignored) {}

        User u = new User(fullName.trim(), email.trim().toLowerCase(), phone.trim(), passwordEncoder.encode("demo123"), role);
        u.setGender(body.get("gender"));
        u.setDob(body.get("dob"));
        u.setAddress(body.get("address"));
        u.setEmployeeId(body.get("employeeId"));
        u.setDesignation(body.get("designation"));
        u.setExperience(body.get("experience"));
        u.setQualification(body.get("qualification"));
        u.setZone(body.get("zone"));
        u.setSpecialization(body.get("specialization"));
        u.setEmergencyContactName(body.get("emergencyContactName"));
        u.setEmergencyContactPhone(body.get("emergencyContactPhone"));

        userRepository.save(u);
        return ResponseEntity.ok(u);
    }

    @PutMapping("/api/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        User u = opt.get();
        if (body.containsKey("fullName")) u.setFullName(body.get("fullName").trim());
        if (body.containsKey("phone")) u.setPhone(body.get("phone").trim());
        if (body.containsKey("role")) {
            try { u.setRole(Role.valueOf(body.get("role").toUpperCase())); } catch (Exception ignored) {}
        }
        if (body.containsKey("gender")) u.setGender(body.get("gender"));
        if (body.containsKey("dob")) u.setDob(body.get("dob"));
        if (body.containsKey("address")) u.setAddress(body.get("address"));
        if (body.containsKey("employeeId")) u.setEmployeeId(body.get("employeeId"));
        if (body.containsKey("designation")) u.setDesignation(body.get("designation"));
        if (body.containsKey("experience")) u.setExperience(body.get("experience"));
        if (body.containsKey("qualification")) u.setQualification(body.get("qualification"));
        if (body.containsKey("zone")) u.setZone(body.get("zone"));
        if (body.containsKey("specialization")) u.setSpecialization(body.get("specialization"));

        userRepository.save(u);
        return ResponseEntity.ok(u);
    }

    @PatchMapping("/api/users/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        User u = opt.get();
        String status = body.getOrDefault("status", "ACTIVE");
        u.setStatus(status.toUpperCase());
        userRepository.save(u);
        return ResponseEntity.ok(u);
    }

    @DeleteMapping("/api/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) return ResponseEntity.notFound().build();
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted from database."));
    }
}
