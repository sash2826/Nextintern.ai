package ai.nextintern.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record InternshipResponse(
        UUID id,
        String title,
        String description,
        String category,
        Integer stipendMin,
        Integer stipendMax,
        String locationCity,
        String locationState,
        String locationCountry,
        String workMode,
        String eligibility,
        Integer durationWeeks,
        LocalDate startDate,
        LocalDate applicationDeadline,
        Integer maxApplicants,
        long applicantCount,
        String status,
        ProviderInfo provider,
        List<SkillInfo> skills,
        String createdAt) {
    public record ProviderInfo(
            UUID id,
            String companyName,
            String logoUrl,
            boolean verified) {
    }

    public record SkillInfo(
            String name,
            String importance) {
    }
}
