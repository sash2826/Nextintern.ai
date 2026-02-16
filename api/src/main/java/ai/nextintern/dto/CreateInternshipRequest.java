package ai.nextintern.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;

public record CreateInternshipRequest(
        @NotBlank String title,
        @NotBlank String description,
        String category,
        @Min(0) Integer stipendMin,
        Integer stipendMax,
        String locationCity,
        String locationState,
        String locationCountry,
        @NotBlank String workMode,
        String eligibility,
        @Min(1) @Max(52) Integer durationWeeks,
        LocalDate startDate,
        LocalDate applicationDeadline,
        @Min(1) Integer maxApplicants,
        List<SkillInput> skills) {
    public record SkillInput(
            @NotBlank String name,
            @NotBlank String importance // required, preferred, bonus
    ) {
    }
}
