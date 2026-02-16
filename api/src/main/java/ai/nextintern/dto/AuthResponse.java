package ai.nextintern.dto;

import java.util.Set;
import java.util.UUID;

public record AuthResponse(
        String accessToken,
        UserInfo user) {
    public record UserInfo(
            UUID id,
            String email,
            String fullName,
            Set<String> roles) {
    }
}
