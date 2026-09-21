package com.quakeguard.gateway.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.Enumeration;

@RestController
@CrossOrigin(origins = "*")
public class GatewayProxyController {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${services.user.url}")
    private String userServiceUrl;

    @Value("${services.otp.url}")
    private String otpServiceUrl;

    @Value("${services.assessment.url}")
    private String assessmentServiceUrl;

    @Value("${services.notification.url}")
    private String notificationServiceUrl;

    @RequestMapping(value = "/api/**")
    public ResponseEntity<?> proxyRequest(@RequestBody(required = false) String body, HttpMethod method, HttpServletRequest request) {
        String path = request.getRequestURI();
        String targetBaseUrl = resolveTargetServiceUrl(path);

        String queryString = request.getQueryString();
        String targetUrl = targetBaseUrl + path + (queryString != null ? "?" + queryString : "");

        HttpHeaders headers = new HttpHeaders();
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String name = headerNames.nextElement();
            if (!name.equalsIgnoreCase("host") && !name.equalsIgnoreCase("content-length")) {
                headers.add(name, request.getHeader(name));
            }
        }

        HttpEntity<String> entity = new HttpEntity<>(body, headers);

        try {
            return restTemplate.exchange(URI.create(targetUrl), method, entity, String.class);
        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("{\"message\":\"Microservice unreachable: " + e.getMessage() + "\"}");
        }
    }

    private String resolveTargetServiceUrl(String path) {
        if (path.startsWith("/api/auth/send-otp") || path.startsWith("/api/auth/verify-otp") || path.startsWith("/api/auth/support-ticket") || path.startsWith("/api/support-tickets")) {
            return otpServiceUrl;
        }
        if (path.startsWith("/api/auth/") || path.startsWith("/api/users")) {
            return userServiceUrl;
        }
        if (path.startsWith("/api/assessments")) {
            return assessmentServiceUrl;
        }
        if (path.startsWith("/api/notifications")) {
            return notificationServiceUrl;
        }
        return userServiceUrl;
    }
}
