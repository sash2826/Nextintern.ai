package ai.nextintern.controller;

import ai.nextintern.dto.InternshipResponse;
import ai.nextintern.service.SavedInternshipService;
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
@RequestMapping("/api/v1/saved-internships")
public class SavedInternshipController {

    private final SavedInternshipService savedInternshipService;

    public SavedInternshipController(SavedInternshipService savedInternshipService) {
        this.savedInternshipService = savedInternshipService;
    }

    /**
     * POST /api/v1/saved-internships/{internshipId} — Toggle save
     */
    @PostMapping("/{internshipId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Boolean> toggleSave(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID internshipId) {
        boolean isSaved = savedInternshipService.toggleSave(userId, internshipId);
        return ResponseEntity.ok(isSaved);
    }

    /**
     * GET /api/v1/saved-internships — List saved internships
     */
    @GetMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Page<InternshipResponse>> listSaved(
            @AuthenticationPrincipal UUID userId,
            @PageableDefault(sort = "savedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(savedInternshipService.getSavedInternships(userId, pageable));
    }
}
