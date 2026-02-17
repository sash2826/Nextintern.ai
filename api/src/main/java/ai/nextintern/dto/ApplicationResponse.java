package ai.nextintern.dto;

import java.time.Instant;
import java.util.UUID;

import ai.nextintern.entity.ApplicationStatus;

public record ApplicationResponse(
                UUID id,
                ApplicationStatus status,
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
