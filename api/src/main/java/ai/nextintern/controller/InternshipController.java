package ai.nextintern.controller;

import ai.nextintern.dto.CreateInternshipRequest;
import ai.nextintern.dto.InternshipResponse;
import ai.nextintern.service.InternshipService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/internships")
public class InternshipController {

    private final InternshipService internshipService;

    public InternshipController(InternshipService internshipService) {
        this.internshipService = internshipService;
    }

    /**
     * GET /api/v1/internships — search active internships (public)
     */
    @GetMapping
    public ResponseEntity<Page<InternshipResponse>> search(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String workMode,
            @RequestParam(required = false) String state,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(internshipService.search(category, workMode, state, page, size));
    }

    /**
     * GET /api/v1/internships/{id} — get single internship (public)
     */
    @GetMapping("/{id}")
    public ResponseEntity<InternshipResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(internshipService.getById(id));
    }

    /**
     * POST /api/v1/internships — create new internship (provider only)
     */
    @PostMapping
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<InternshipResponse> create(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody CreateInternshipRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(internshipService.create(userId, request));
    }

    /**
     * GET /api/v1/internships/my — list provider's own internships
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<Page<InternshipResponse>> myInternships(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(internshipService.getByProvider(userId, page, size));
    }
}
