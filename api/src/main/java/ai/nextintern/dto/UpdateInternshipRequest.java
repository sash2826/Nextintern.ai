package ai.nextintern.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;

public record UpdateInternshipRequest(
                String title,
                String description,
                String category,
                @Min(0) Integer stipendMin,
                @Min(0) Integer stipendMax,
                String locationCity,
                String locationState,
                String locationCountry,
                String workMode,
                String eligibility,
                @Min(1) @Max(52) Integer durationWeeks,
                LocalDate startDate,
                LocalDate applicationDeadline,
                @Min(1) Integer maxApplicants,
                List<CreateInternshipRequest.SkillInput> skills) {

        @AssertTrue(message = "Stipend max must be greater than or equal to stipend min")
        public boolean isStipendRangeValid() {
                if (stipendMin != null && stipendMax != null) {
                        return stipendMax >= stipendMin;
                }
                return true;
        }
}
