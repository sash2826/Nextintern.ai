package ai.nextintern.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateProfileRequest(
        String educationLevel,
        String university,
        @Min(2020) @Max(2035) Integer graduationYear,
        String locationCity,
        String locationState,
        String locationCountry,
        List<String> interests,
        @Size(max = 2000) String bio,
        List<SkillInput> skills) {
    public record SkillInput(
            String name,
            @Min(1) @Max(5) int proficiency) {
    }
}
