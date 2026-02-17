package ai.nextintern.event;

import ai.nextintern.event.dto.EventType;
import ai.nextintern.event.dto.InternshipEvent;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.awaitility.Awaitility.await;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;

import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;

@SpringBootTest
@ActiveProfiles("local")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Tag("integration")
class EventIntegrationTest {

    @Autowired
    private EventPublisher eventPublisher;

    @SpyBean
    private EventConsumer eventConsumer;

    @Autowired
    private SqsTemplate sqsTemplate;

    @Test
    void shouldPublishAndConsumeEvent() {
        // Given
        UUID eventId = UUID.randomUUID();
        InternshipEvent event = new InternshipEvent(
                eventId,
                EventType.INTERNSHIP_CREATED,
                UUID.randomUUID(),
                Instant.now(),
                "trace-integration",
                null);

        // When
        eventPublisher.publish(event);

        // Then
        await().atMost(10, TimeUnit.SECONDS).untilAsserted(() -> {
            verify(eventConsumer).consume(argThat(e -> e.eventId().equals(eventId)));
        });
    }
}
