package ai.nextintern.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateProfileRequest(
        @jakarta.validation.constraints.NotBlank String fullName,
        @jakarta.validation.constraints.NotBlank String educationLevel,
        @jakarta.validation.constraints.NotBlank String university,
        @jakarta.validation.constraints.NotBlank String locationCity,
        @jakarta.validation.constraints.NotBlank String locationState,
        List<String> interests,
        @org.hibernate.validator.constraints.URL String resumeUrl,
        @Size(max = 1000) String bio) {
}
