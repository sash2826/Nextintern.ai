package ai.nextintern.event;

import ai.nextintern.event.dto.InternshipEvent;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventConsumer {

    // Ideally, we would inject other services here (e.g., SearchService,
    // NotificationService)
    // private final SearchService searchService;

    @SqsListener("${app.events.queues.internship-events}")
    public void consume(InternshipEvent event) {
        log.info("Received event: {} of type {}", event.eventId(), event.eventType());

        try {
            switch (event.eventType()) {
                case INTERNSHIP_CREATED:
                case INTERNSHIP_UPDATED:
                    handleInternshipUpdate(event);
                    break;
                case INTERNSHIP_DELETED:
                    handleInternshipDeletion(event);
                    break;
                default:
                    log.warn("Unknown event type: {}", event.eventType());
            }
        } catch (Exception e) {
            log.error("Error processing event {}", event.eventId(), e);
            throw e; // Throwing exception triggers SQS retry/DLQ mechanism
        }
    }

    private void handleInternshipUpdate(InternshipEvent event) {
        log.info("Processing internship update for ID: {}", event.internshipId());
        // TODO: Implement actual logic (e.g., OpenSearch indexing)
        // searchService.indexInternship(event.internshipId());
    }

    private void handleInternshipDeletion(InternshipEvent event) {
        log.info("Processing internship deletion for ID: {}", event.internshipId());
        // TODO: Implement actual logic
        // searchService.deleteInternship(event.internshipId());
    }
}
