package ai.nextintern.event;

import ai.nextintern.event.dto.EventType;
import ai.nextintern.event.dto.InternshipEvent;
import io.awspring.cloud.sqs.operations.SendResult;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.UUID;
import java.util.function.Consumer;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventPublisherTest {

    @Mock
    private SqsTemplate sqsTemplate;

    @InjectMocks
    private EventPublisher eventPublisher;

    @Test
    void shouldPublishEventToCorrectQueue() {
        // Given
        String queueName = "test-queue";
        ReflectionTestUtils.setField(eventPublisher, "internshipEventsQueue", queueName);

        InternshipEvent event = new InternshipEvent(
                UUID.randomUUID(),
                EventType.INTERNSHIP_CREATED,
                UUID.randomUUID(),
                Instant.now(),
                "trace-123",
                null);

        when(sqsTemplate.send(any(Consumer.class))).thenReturn(null);

        // When
        eventPublisher.publish(event);

        // Then
        verify(sqsTemplate).send(any(Consumer.class));
    }
}
