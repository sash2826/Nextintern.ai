package ai.nextintern.event.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record InternshipEvent(
        UUID eventId,
        EventType eventType,
        UUID internshipId,
        Instant timestamp,
        String traceId,
        JsonNode payload // Use JsonNode for flexibility/payload schema evolution
) {
}
