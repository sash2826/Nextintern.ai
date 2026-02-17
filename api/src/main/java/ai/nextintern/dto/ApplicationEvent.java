package ai.nextintern.dto;

import ai.nextintern.entity.ApplicationStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.Instant;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ApplicationEvent(
        UUID applicationId,
        UUID internshipId,
        UUID studentId,
        Type eventType,
        ApplicationStatus newStatus,
        Instant timestamp,
        String traceId) {
    public enum Type {
        APPLICATION_CREATED,
        STATUS_CHANGED
    }
}
