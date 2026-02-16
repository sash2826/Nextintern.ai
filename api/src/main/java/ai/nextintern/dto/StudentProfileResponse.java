package ai.nextintern.dto;

import java.util.List;
import java.util.UUID;

public record StudentProfileResponse(
        UUID id,
        UUID userId,
        String fullName,
        String email,
        String educationLevel,
        String university,
        Integer graduationYear,
        String locationCity,
        String locationState,
        String locationCountry,
        List<String> interests,
        String bio,
        List<SkillInfo> skills,
        int profileCompleteness) {
    public record SkillInfo(
            int id,
            String name,
            String category,
            int proficiency) {
    }
}
