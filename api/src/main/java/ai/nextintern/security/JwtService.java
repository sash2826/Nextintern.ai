package ai.nextintern.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * JWT service implementing RS256 with jti-based revocation.
 * <p>
 * Access token: RS256, 15-min TTL, contains {sub, roles[], iat, exp, jti}
 * Refresh token: opaque UUID stored in Redis with family-based rotation.
 */
@Service
public class JwtService {

    @Value("${app.jwt.private-key-path}")
    private String privateKeyPath;

    @Value("${app.jwt.public-key-path}")
    private String publicKeyPath;

    @Value("${app.jwt.access-token-ttl:900}")
    private long accessTokenTtl;

    @Value("${app.jwt.refresh-token-ttl:604800}")
    private long refreshTokenTtl;

    private PrivateKey privateKey;
    private PublicKey publicKey;

    private final StringRedisTemplate redisTemplate;

    private static final String BLOCKLIST_PREFIX = "jwt:blocklist:";
    private static final String REFRESH_PREFIX = "jwt:refresh:";
    private static final String REFRESH_FAMILY_PREFIX = "jwt:family:";

    public JwtService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @PostConstruct
    public void init() throws Exception {
        this.privateKey = loadPrivateKey(privateKeyPath);
        this.publicKey = loadPublicKey(publicKeyPath);
    }

    // ── Access Token ────────────────────────────────────────

    public String generateAccessToken(UUID userId, Set<String> roles) {
        String jti = UUID.randomUUID().toString();
        Instant now = Instant.now();

        return Jwts.builder()
                .id(jti)
                .subject(userId.toString())
                .claim("roles", roles)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(accessTokenTtl)))
                .signWith(privateKey, Jwts.SIG.RS256)
                .compact();
    }

    public Claims parseAccessToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(publicKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        // Check jti blocklist
        if (isJtiBlocked(claims.getId())) {
            throw new JwtException("Token has been revoked");
        }

        return claims;
    }

    public void blockAccessToken(String jti, Instant expiration) {
        long ttl = Duration.between(Instant.now(), expiration).toSeconds();
        if (ttl > 0) {
            redisTemplate.opsForValue().set(
                    BLOCKLIST_PREFIX + jti,
                    "1",
                    ttl,
                    TimeUnit.SECONDS);
        }
    }

    private boolean isJtiBlocked(String jti) {
        return jti != null && Boolean.TRUE.equals(redisTemplate.hasKey(BLOCKLIST_PREFIX + jti));
    }

    // ── Refresh Token ───────────────────────────────────────

    /**
     * Generate a new refresh token with family tracking.
     * Returns the opaque token value.
     */
    public String generateRefreshToken(UUID userId, Set<String> roles) {
        String token = UUID.randomUUID().toString();
        String familyId = UUID.randomUUID().toString();

        storeRefreshToken(token, userId, roles, familyId);
        return token;
    }

    /**
     * Rotate a refresh token: invalidate old, issue new, same family.
     * If the old token is already used (replay), revoke the entire family.
     */
    public RefreshResult rotateRefreshToken(String oldToken) {
        String data = redisTemplate.opsForValue().get(REFRESH_PREFIX + oldToken);
        if (data == null) {
            // Token not found — could be a replay attack
            return null;
        }

        // Parse stored data: userId|roles|familyId|used
        String[] parts = data.split("\\|", 4);
        if (parts.length < 4)
            return null;

        UUID userId = UUID.fromString(parts[0]);
        Set<String> roles = new HashSet<>(Arrays.asList(parts[1].split(",")));
        String familyId = parts[2];
        boolean alreadyUsed = "1".equals(parts[3]);

        if (alreadyUsed) {
            // Replay detected — revoke entire family
            revokeFamilyTokens(familyId);
            return null;
        }

        // Mark old token as used (for replay detection), then delete after short grace
        // period
        redisTemplate.opsForValue().set(
                REFRESH_PREFIX + oldToken,
                parts[0] + "|" + parts[1] + "|" + parts[2] + "|1",
                30, TimeUnit.SECONDS // Grace period for concurrent requests
        );

        // Issue new token in same family
        String newToken = UUID.randomUUID().toString();
        storeRefreshToken(newToken, userId, roles, familyId);

        String accessToken = generateAccessToken(userId, roles);
        return new RefreshResult(accessToken, newToken, userId);
    }

    public void revokeRefreshToken(String token) {
        String data = redisTemplate.opsForValue().get(REFRESH_PREFIX + token);
        if (data != null) {
            String[] parts = data.split("\\|", 4);
            if (parts.length >= 3) {
                revokeFamilyTokens(parts[2]);
            }
        }
        redisTemplate.delete(REFRESH_PREFIX + token);
    }

    private void storeRefreshToken(String token, UUID userId, Set<String> roles, String familyId) {
        String data = userId + "|" + String.join(",", roles) + "|" + familyId + "|0";
        redisTemplate.opsForValue().set(
                REFRESH_PREFIX + token,
                data,
                refreshTokenTtl,
                TimeUnit.SECONDS);
        // Track token in family set
        redisTemplate.opsForSet().add(REFRESH_FAMILY_PREFIX + familyId, token);
        redisTemplate.expire(REFRESH_FAMILY_PREFIX + familyId, refreshTokenTtl, TimeUnit.SECONDS);
    }

    private void revokeFamilyTokens(String familyId) {
        Set<String> tokens = redisTemplate.opsForSet().members(REFRESH_FAMILY_PREFIX + familyId);
        if (tokens != null) {
            for (String t : tokens) {
                redisTemplate.delete(REFRESH_PREFIX + t);
            }
        }
        redisTemplate.delete(REFRESH_FAMILY_PREFIX + familyId);
    }

    // ── Key Loading ─────────────────────────────────────────

    private PrivateKey loadPrivateKey(String path) throws Exception {
        String key = readKeyFile(path);
        key = key.replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        byte[] decoded = Base64.getDecoder().decode(key);
        return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(decoded));
    }

    private PublicKey loadPublicKey(String path) throws Exception {
        String key = readKeyFile(path);
        key = key.replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");
        byte[] decoded = Base64.getDecoder().decode(key);
        return KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(decoded));
    }

    private String readKeyFile(String path) throws IOException {
        if (path.startsWith("classpath:")) {
            var resource = getClass().getClassLoader().getResourceAsStream(path.substring(10));
            if (resource == null)
                throw new IOException("Key file not found: " + path);
            return new String(resource.readAllBytes());
        }
        return Files.readString(Path.of(path));
    }

    // ── Result Types ────────────────────────────────────────

    public record RefreshResult(String accessToken, String refreshToken, UUID userId) {
    }
}
