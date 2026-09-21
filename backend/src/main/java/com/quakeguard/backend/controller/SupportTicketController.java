package com.quakeguard.backend.controller;

import com.quakeguard.backend.model.SupportTicket;
import com.quakeguard.backend.repository.SupportTicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/support-tickets")
@CrossOrigin(originPatterns = "*")
public class SupportTicketController {

    @Autowired
    private SupportTicketRepository supportTicketRepository;

    @GetMapping
    public ResponseEntity<List<SupportTicket>> getAllTickets() {
        return ResponseEntity.ok(supportTicketRepository.findAllByOrderBySubmittedAtDesc());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<SupportTicket> opt = supportTicketRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        SupportTicket t = opt.get();
        if (body.containsKey("status")) {
            t.setStatus(body.get("status").toUpperCase());
        }
        supportTicketRepository.save(t);
        return ResponseEntity.ok(t);
    }
}
