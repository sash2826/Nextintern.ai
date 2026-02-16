package ai.nextintern.dto;

import jakarta.validation.constraints.Size;

public record ApplyRequest(
        @Size(max = 500, message = "Cover note cannot exceed 500 characters") String coverNote) {
}
