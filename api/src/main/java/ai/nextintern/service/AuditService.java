package ai.nextintern.service;

import ai.nextintern.entity.AuditLog;
import ai.nextintern.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository repository;

    @Async
    public void log(UUID actorId,
            String action,
            String targetType,
            String targetId,
            String details,
            String ipAddress) {

        AuditLog log = AuditLog.builder()
                .actorId(actorId)
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .details(details)
                .ipAddress(ipAddress)
                .build();

        repository.save(log);
    }
}
