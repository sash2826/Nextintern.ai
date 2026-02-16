package ai.nextintern.dto;

import jakarta.validation.constraints.Pattern;

public record UpdateApplicationStatusRequest(
        @Pattern(regexp = "shortlisted|accepted|rejected|withdrawn|applied", message = "Invalid status") String status) {
}
