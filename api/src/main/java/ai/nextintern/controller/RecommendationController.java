package ai.nextintern.controller;

import ai.nextintern.service.RecommendationService;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    /**
     * GET /api/v1/recommendations — get personalized internship recommendations.
     * Student role required (enforced by SecurityConfig).
     */
    @GetMapping
    public ResponseEntity<JsonNode> getRecommendations(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(recommendationService.getRecommendations(userId, Math.min(limit, 50)));
    }
}
