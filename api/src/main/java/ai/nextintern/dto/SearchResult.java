package ai.nextintern.dto;

import java.util.List;
import java.util.UUID;

public record SearchResult(
        List<UUID> ids,
        long total) {
}
