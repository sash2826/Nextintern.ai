package ai.nextintern.dto;

import java.time.Instant;
import java.util.UUID;

public record ApplicationResponse(
        UUID id,
        String status,
        String coverNote,
        String appliedAt,
        ApplicantInfo student,
        InternshipInfo internship) {
    public record ApplicantInfo(
            UUID id,
            String fullName,
            String email,
            String resumeUrl,
            String educationLevel,
            String university) {
    }

    public record InternshipInfo(
            UUID id,
            String title,
            String companyName) {
    }
}
