package ai.nextintern.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;

/**
 * HTTP client for the internal recs service with HMAC authentication.
 * Implements the v3 trust boundary: HMAC-SHA256(timestamp:method:path:bodyHash,
 * secret)
 * with 300s replay window.
 */
@Service
public class RecsClient {

    @Value("${app.recs.service-url}")
    private String serviceUrl;

    @Value("${app.recs.hmac-secret}")
    private String hmacSecret;

    @Value("${app.recs.timeout-ms:5000}")
    private int timeoutMs;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public RecsClient(ObjectMapper objectMapper) {
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
    }

    /**
     * POST to the recs service with HMAC auth header.
     */
    public JsonNode post(String path, Object body) {
        try {
            String bodyJson = objectMapper.writeValueAsString(body);
            String url = serviceUrl + path;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Service-Auth", generateHmac("POST", path, bodyJson));

            HttpEntity<String> entity = new HttpEntity<>(bodyJson, headers);
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, JsonNode.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Recs service returned " + response.getStatusCode());
            }

            return response.getBody();
        } catch (Exception e) {
            throw new RuntimeException("Failed to call recs service: " + e.getMessage(), e);
        }
    }

    /**
     * Generate HMAC auth header value.
     * Format: "timestamp:signature"
     * Where signature = HMAC-SHA256(timestamp:method:path:bodyHash, secret)
     */
    private String generateHmac(String method, String path, String body) {
        try {
            long timestamp = Instant.now().getEpochSecond();

            // Body hash
            String bodyHash = body != null && !body.isEmpty()
                    ? sha256(body)
                    : "";

            // Message to sign
            String message = timestamp + ":" + method + ":" + path + ":" + bodyHash;

            // HMAC-SHA256
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(hmacSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] sig = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
            String signature = HexFormat.of().formatHex(sig);

            return timestamp + ":" + signature;
        } catch (Exception e) {
            throw new RuntimeException("HMAC generation failed", e);
        }
    }

    private String sha256(String input) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }
}
