package ai.nextintern.event;

import ai.nextintern.event.dto.InternshipEvent;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventPublisher {

    private final SqsTemplate sqsTemplate;

    @Value("${app.events.queues.internship-events}")
    private String internshipEventsQueue;

    public void publish(InternshipEvent event) {
        try {
            // Ensure traceId is present
            String traceId = event.traceId();
            if (traceId == null || traceId.isEmpty()) {
                traceId = MDC.get("traceId");
                if (traceId == null) {
                    traceId = UUID.randomUUID().toString();
                }
                // Re-create event with traceId if needed (since Records are immutable)
                event = new InternshipEvent(
                        event.eventId(),
                        event.eventType(),
                        event.internshipId(),
                        event.timestamp(),
                        traceId,
                        event.payload());
            }

            final InternshipEvent finalEvent = event;
            log.info("Publishing event {} to queue {}", event.eventId(), internshipEventsQueue);
            sqsTemplate.send(to -> to
                    .queue(internshipEventsQueue)
                    .payload(finalEvent));

            log.debug("Event published successfully: id={}, type={}, traceId={}",
                    event.eventId(), event.eventType(), event.traceId());
        } catch (Exception e) {
            log.error("Failed to publish event {}", event.eventId(), e);
            throw e;
        }
    }

    @Value("${app.events.queues.application-events}")
    private String applicationEventsQueue;

    public void publish(ai.nextintern.dto.ApplicationEvent event) {
        try {
            String traceId = event.traceId();
            if (traceId == null || traceId.isEmpty()) {
                traceId = MDC.get("traceId");
                if (traceId == null) {
                    traceId = UUID.randomUUID().toString();
                }
                event = new ai.nextintern.dto.ApplicationEvent(
                        event.applicationId(),
                        event.internshipId(),
                        event.studentId(),
                        event.eventType(),
                        event.newStatus(),
                        event.timestamp(),
                        traceId);
            }

            final ai.nextintern.dto.ApplicationEvent finalEvent = event;
            log.info("Publishing application event appId={}, type={} to queue {}",
                    event.applicationId(), event.eventType(), applicationEventsQueue);
            sqsTemplate.send(to -> to
                    .queue(applicationEventsQueue)
                    .payload(finalEvent));
        } catch (Exception e) {
            log.error("Failed to publish application event {}", event.applicationId(), e);
            throw e;
        }
    }
}
