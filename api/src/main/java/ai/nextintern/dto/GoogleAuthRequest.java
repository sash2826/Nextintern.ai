package ai.nextintern.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleAuthRequest(
        @NotBlank(message = "Google ID token is required") String idToken,
        String role // Optional: for first-time sign-up role selection (defaults to "student")
) {
}
