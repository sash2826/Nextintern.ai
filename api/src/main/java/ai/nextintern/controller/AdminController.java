package ai.nextintern.controller;

import ai.nextintern.dto.AdminStatsDTO;
import ai.nextintern.entity.AuditLog;
import ai.nextintern.entity.User;
import ai.nextintern.repository.ApplicationRepository;
import ai.nextintern.repository.AuditLogRepository;
import ai.nextintern.repository.InternshipRepository;
import ai.nextintern.repository.UserRepository;
import ai.nextintern.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final InternshipRepository internshipRepository;
    private final ApplicationRepository applicationRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditService auditService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDTO> getStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByIsActiveTrue();
        long totalInternships = internshipRepository.count();
        long totalApplications = applicationRepository.count();

        return ResponseEntity.ok(new AdminStatsDTO(totalUsers, activeUsers, totalInternships, totalApplications));
    }

    @GetMapping("/users")
    public ResponseEntity<Page<User>> getUsers(
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(userRepository.findAll(pageable));
    }

    @PatchMapping("/users/{id}/ban")
    public ResponseEntity<Void> banUser(@PathVariable UUID id, @AuthenticationPrincipal User admin,
            HttpServletRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsActive(false);
        userRepository.save(user);

        auditService.log(
                admin.getId(),
                "BAN_USER",
                "USER",
                id.toString(),
                "User banned by admin",
                extractIp(request));

        return ResponseEntity.ok().build();
    }

    @PatchMapping("/users/{id}/unban")
    public ResponseEntity<Void> unbanUser(@PathVariable UUID id, @AuthenticationPrincipal User admin,
            HttpServletRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsActive(true);
        userRepository.save(user);

        auditService.log(
                admin.getId(),
                "UNBAN_USER",
                "USER",
                id.toString(),
                "User unbanned by admin",
                extractIp(request));

        return ResponseEntity.ok().build();
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<Page<AuditLog>> getAuditLogs(
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(auditLogRepository.findAll(pageable));
    }

    private String extractIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
