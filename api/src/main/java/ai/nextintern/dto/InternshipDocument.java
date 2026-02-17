package ai.nextintern.dto;

import ai.nextintern.entity.Internship;
import ai.nextintern.entity.InternshipSkill;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public record InternshipDocument(
        String id,
        String title,
        String description,
        String category,
        @JsonProperty("location_city") String locationCity,
        @JsonProperty("location_state") String locationState,
        @JsonProperty("location_country") String locationCountry,
        @JsonProperty("work_mode") String workMode,
        @JsonProperty("stipend_min") Integer stipendMin,
        @JsonProperty("stipend_max") Integer stipendMax,
        @JsonProperty("duration_weeks") Integer durationWeeks,
        @JsonProperty("start_date") String startDate,
        @JsonProperty("application_deadline") String applicationDeadline,
        String status,
        @JsonProperty("created_at") String createdAt,
        @JsonProperty("provider_id") String providerId,
        @JsonProperty("provider_name") String providerName,
        @JsonProperty("provider_verified") boolean providerVerified,
        @JsonProperty("skills_required") List<String> skillsRequired,
        @JsonProperty("skills_preferred") List<String> skillsPreferred,
        @JsonProperty("skills_bonus") List<String> skillsBonus,
        @JsonProperty("skills_all") List<String> skillsAll) {
    public static InternshipDocument from(Internship internship) {
        List<String> required = new ArrayList<>();
        List<String> preferred = new ArrayList<>();
        List<String> bonus = new ArrayList<>();
        List<String> all = new ArrayList<>();

        if (internship.getSkills() != null) {
            for (InternshipSkill is : internship.getSkills()) {
                if (is.getSkill() != null && is.getSkill().getName() != null) {
                    String skillName = is.getSkill().getName();
                    all.add(skillName);
                    switch (is.getImportance() != null ? is.getImportance().toLowerCase() : "") {
                        case "required" -> required.add(skillName);
                        case "preferred" -> preferred.add(skillName);
                        case "bonus" -> bonus.add(skillName);
                    }
                }
            }
        }

        String providerId = internship.getProvider() != null && internship.getProvider().getId() != null
                ? internship.getProvider().getId().toString()
                : null;
        String providerName = internship.getProvider() != null ? internship.getProvider().getCompanyName() : null;
        boolean providerVerified = internship.getProvider() != null
                && Boolean.TRUE.equals(internship.getProvider().getVerified());

        return new InternshipDocument(
                internship.getId().toString(),
                internship.getTitle(),
                internship.getDescription(),
                internship.getCategory(),
                internship.getLocationCity(),
                internship.getLocationState(),
                internship.getLocationCountry(),
                internship.getWorkMode(),
                internship.getStipendMin(),
                internship.getStipendMax(),
                internship.getDurationWeeks(),
                internship.getStartDate() != null ? internship.getStartDate().toString() : null,
                internship.getApplicationDeadline() != null ? internship.getApplicationDeadline().toString() : null,
                internship.getStatus(),
                internship.getCreatedAt() != null ? internship.getCreatedAt().toString() : null,
                providerId,
                providerName,
                providerVerified,
                required,
                preferred,
                bonus,
                all);
    }
}
