package com.quakeguard.backend.controller;

import com.quakeguard.backend.model.Role;
import com.quakeguard.backend.model.User;
import com.quakeguard.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(originPatterns = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        Optional<User> u = userRepository.findById(id);
        if (u.isPresent()) return ResponseEntity.ok(u.get());
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> body) {
        String fullName = body.get("fullName");
        String email = body.get("email");
        String phone = body.get("phone");
        String roleStr = body.get("role");

        if (fullName == null || email == null || phone == null || roleStr == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Full name, email, phone and role are required."));
        }

        if (userRepository.existsByEmailIgnoreCase(email.trim())) {
            return ResponseEntity.badRequest().body(Map.of("message", "A user with this email already exists."));
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

    @PutMapping("/{id}")
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
        if (body.containsKey("emergencyContactName")) u.setEmergencyContactName(body.get("emergencyContactName"));
        if (body.containsKey("emergencyContactPhone")) u.setEmergencyContactPhone(body.get("emergencyContactPhone"));

        userRepository.save(u);
        return ResponseEntity.ok(u);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        User u = opt.get();
        String status = body.getOrDefault("status", "ACTIVE");
        u.setStatus(status.toUpperCase());
        userRepository.save(u);
        return ResponseEntity.ok(u);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) return ResponseEntity.notFound().build();
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User removed from database successfully."));
    }
}
