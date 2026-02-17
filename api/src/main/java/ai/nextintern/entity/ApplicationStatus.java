package ai.nextintern.entity;

public enum ApplicationStatus {
    APPLIED,
    SHORTLISTED,
    HIRED,
    REJECTED,
    WITHDRAWN;

    public boolean isTerminal() {
        return this == HIRED || this == REJECTED || this == WITHDRAWN;
    }

    public boolean canTransitionTo(ApplicationStatus nextStatus) {
        if (this.isTerminal()) {
            return false;
        }
        return switch (this) {
            case APPLIED -> nextStatus == SHORTLISTED || nextStatus == REJECTED || nextStatus == WITHDRAWN;
            case SHORTLISTED -> nextStatus == HIRED || nextStatus == REJECTED || nextStatus == WITHDRAWN;
            default -> false;
        };
    }
}
