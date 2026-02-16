package ai.nextintern.service;

import ai.nextintern.entity.*;
import ai.nextintern.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Recommendation service — proxies to the FastAPI recs service with Redis
 * caching.
 */
@Service
public class RecommendationService {

    private static final String CACHE_PREFIX = "rec:";
    private static final long CACHE_TTL_SECONDS = 3600; // 1 hour

    private final RecsClient recsClient;
    private final StudentProfileRepository profileRepository;
    private final StringRedisTemplate redisTemplate;

    public RecommendationService(RecsClient recsClient,
            StudentProfileRepository profileRepository,
            StringRedisTemplate redisTemplate) {
        this.recsClient = recsClient;
        this.profileRepository = profileRepository;
        this.redisTemplate = redisTemplate;
    }

    public JsonNode getRecommendations(UUID userId, int limit) {
        // Check Redis cache
        String cacheKey = CACHE_PREFIX + userId + ":" + limit;
        String cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            try {
                return new com.fasterxml.jackson.databind.ObjectMapper().readTree(cached);
            } catch (Exception ignored) {
            }
        }

        // Build request for recs service
        StudentProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new NoSuchElementException("Profile not found"));

        List<Map<String, Object>> skills = profile.getSkills().stream()
                .map(ss -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("name", ss.getSkill().getName());
                    m.put("proficiency", (int) ss.getProficiency());
                    return m;
                })
                .collect(Collectors.toList());

        List<String> interests = profile.getInterests() != null
                ? Arrays.asList(profile.getInterests())
                : List.of();

        Map<String, Object> requestBody = Map.of(
                "user_id", userId.toString(),
                "profile", Map.of(
                        "skills", skills,
                        "interests", interests,
                        "education_level", Optional.ofNullable(profile.getEducationLevel()).orElse(""),
                        "location_city", Optional.ofNullable(profile.getLocationCity()).orElse(""),
                        "location_state", Optional.ofNullable(profile.getLocationState()).orElse("")),
                "context", Map.of(
                        "exclude_ids", List.of(),
                        "limit", limit));

        JsonNode result = recsClient.post("/recommend", requestBody);

        // Cache result
        try {
            String json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(result);
            redisTemplate.opsForValue().set(cacheKey, json, CACHE_TTL_SECONDS, TimeUnit.SECONDS);
        } catch (Exception ignored) {
        }

        return result;
    }
}
