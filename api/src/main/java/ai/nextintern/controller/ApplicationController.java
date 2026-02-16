package ai.nextintern.controller;

import ai.nextintern.dto.ApplicationResponse;
import ai.nextintern.dto.ApplyRequest;
import ai.nextintern.dto.UpdateApplicationStatusRequest;
import ai.nextintern.service.ApplicationService;
import jakarta.validation.Valid;
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
@RequestMapping("/api/v1")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    /**
     * POST /api/v1/internships/{id}/apply — Student applies to internship
     */
    @PostMapping("/internships/{id}/apply")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApplicationResponse> apply(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) ApplyRequest request) { // Handle optional body
        ApplyRequest req = request != null ? request : new ApplyRequest(null);
        return ResponseEntity.ok(applicationService.apply(userId, id, req));
    }

    /**
     * DELETE /api/v1/internships/{id}/apply — Student withdraws application
     */
    @DeleteMapping("/internships/{id}/apply")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> withdraw(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        applicationService.withdraw(userId, id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/v1/applications/my — Student lists own applications
     */
    @GetMapping("/applications/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Page<ApplicationResponse>> myApplications(
            @AuthenticationPrincipal UUID userId,
            @PageableDefault(sort = "appliedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(applicationService.getMyApplications(userId, pageable));
    }

    /**
     * GET /api/v1/internships/{id}/applications — Provider lists applications for
     * their internship
     */
    @GetMapping("/internships/{id}/applications")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<Page<ApplicationResponse>> getApplications(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @PageableDefault(sort = "appliedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(applicationService.getApplicationsForInternship(userId, id, pageable));
    }

    /**
     * PATCH /api/v1/applications/{id}/status — Provider updates status
     */
    @PatchMapping("/applications/{id}/status")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<ApplicationResponse> updateStatus(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateApplicationStatusRequest request) {
        return ResponseEntity.ok(applicationService.updateStatus(userId, id, request));
    }
}
