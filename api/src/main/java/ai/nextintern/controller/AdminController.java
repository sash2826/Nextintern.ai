package ai.nextintern.controller;

import ai.nextintern.service.InternshipService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final InternshipService internshipService;

    public AdminController(InternshipService internshipService) {
        this.internshipService = internshipService;
    }

    /**
     * POST /api/v1/admin/reindex — manually reindex all internships
     * Useful for synchronization or after bulk DB updates.
     */
    @PostMapping("/reindex")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> reindexAll() {
        internshipService.reindexAll();
        return ResponseEntity.ok().build();
    }
}
