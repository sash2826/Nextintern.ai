package ai.nextintern.dto;

public record AdminStatsDTO(
        long totalUsers,
        long activeUsers,
        long totalInternships,
        long totalApplications) {
}
