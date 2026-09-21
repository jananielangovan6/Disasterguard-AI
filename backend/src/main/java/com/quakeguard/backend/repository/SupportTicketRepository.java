package com.quakeguard.backend.repository;

import com.quakeguard.backend.model.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    List<SupportTicket> findAllByOrderBySubmittedAtDesc();
}
