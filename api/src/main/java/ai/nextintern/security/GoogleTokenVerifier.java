package ai.nextintern.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Verifies Google ID tokens using Google's tokeninfo endpoint.
 * Lightweight alternative to pulling in the full google-api-client library.
 */
@Service
public class GoogleTokenVerifier {

    private static final String GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";

    @Value("${app.google.client-id}")
    private String clientId;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Verify a Google ID token and extract the user info.
     *
     * @param idToken The Google ID token from the frontend
     * @return GoogleUser with email, name, and Google subject ID
     * @throws IllegalArgumentException if the token is invalid
     */
    public GoogleUser verify(String idToken) {
        try {
            String response = restTemplate.getForObject(GOOGLE_TOKENINFO_URL + idToken, String.class);
            JsonNode json = objectMapper.readTree(response);

            // Verify audience matches our client ID
            String aud = json.get("aud").asText();
            if (!clientId.equals(aud)) {
                throw new IllegalArgumentException("Token audience mismatch");
            }

            // Verify token is not expired (Google's endpoint already checks this,
            // but double-check the issuer)
            String iss = json.get("iss").asText();
            if (!"accounts.google.com".equals(iss) && !"https://accounts.google.com".equals(iss)) {
                throw new IllegalArgumentException("Invalid token issuer");
            }

            String email = json.get("email").asText();
            boolean emailVerified = "true".equals(json.get("email_verified").asText());
            String name = json.has("name") ? json.get("name").asText() : email.split("@")[0];
            String sub = json.get("sub").asText(); // Google's unique user ID

            if (!emailVerified) {
                throw new IllegalArgumentException("Google email is not verified");
            }

            return new GoogleUser(sub, email, name);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid Google ID token: " + e.getMessage());
        }
    }

    public record GoogleUser(String googleId, String email, String fullName) {
    }
}
