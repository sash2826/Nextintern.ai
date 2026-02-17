package ai.nextintern.dto;

import ai.nextintern.entity.ApplicationStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateApplicationStatusRequest(
                @NotNull(message = "Status is required") ApplicationStatus status) {
}
