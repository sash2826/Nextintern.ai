package ai.nextintern.service;

import ai.nextintern.dto.ApplicationEvent;
import ai.nextintern.dto.ApplicationResponse;
import ai.nextintern.dto.ApplyRequest;
import ai.nextintern.dto.UpdateApplicationStatusRequest;
import ai.nextintern.entity.*;
import ai.nextintern.event.EventConsumer;
import ai.nextintern.event.EventPublisher;
import ai.nextintern.repository.*;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.awaitility.Awaitility.await;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;

import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;

@SpringBootTest
@ActiveProfiles("local")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Tag("integration")
@Transactional
class ApplicationIntegrationTest {

        @Autowired
        private ApplicationService applicationService;

        @Autowired
        private ApplicationRepository applicationRepository;

        @Autowired
        private StudentProfileRepository studentProfileRepository;

        @Autowired
        private InternshipRepository internshipRepository;

        @Autowired
        private ProviderRepository providerRepository;

        @SpyBean
        private EventPublisher eventPublisher;

        @Autowired // Real SqsTemplate connected to LocalStack from application-test.yml
        private SqsTemplate sqsTemplate;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private RoleRepository roleRepository;

        private UUID studentUserId;
        private UUID providerUserId;
        private UUID internshipId;
        private Role providerRole;

        @BeforeEach
        void setUp() {
                applicationRepository.deleteAll();
                internshipRepository.deleteAll();
                studentProfileRepository.deleteAll();
                providerRepository.deleteAll();
                userRepository.deleteAll();
                roleRepository.deleteAll();

                // 0. Create Roles
                Role studentRole = roleRepository.save(Role.builder().name("ROLE_STUDENT").build());
                providerRole = roleRepository.save(Role.builder().name("ROLE_PROVIDER").build());

                // 1. Create Student User & Profile
                User studentUser = User.builder()
                                .email("student@example.com")
                                .passwordHash("hashed")
                                .roles(java.util.Set.of(studentRole))
                                .fullName("Student User")
                                .isActive(true)
                                .emailVerified(true)
                                .build();
                studentUser = userRepository.save(studentUser);
                studentUserId = studentUser.getId();

                StudentProfile studentProfile = StudentProfile.builder()
                                .user(studentUser)
                                .educationLevel("Undergraduate")
                                .university("University of Tech")
                                .build();
                studentProfileRepository.save(studentProfile);

                // 2. Create Provider User & Provider & Internship
                User providerUser = User.builder()
                                .email("provider@example.com")
                                .passwordHash("hashed")
                                .roles(java.util.Set.of(providerRole))
                                .fullName("Provider User")
                                .isActive(true)
                                .emailVerified(true)
                                .build();
                providerUser = userRepository.save(providerUser);
                providerUserId = providerUser.getId();

                Provider provider = Provider.builder()
                                .user(providerUser)
                                .companyName("Tech Corp")
                                .verified(true)
                                .build();
                provider = providerRepository.save(provider);

                Internship internship = Internship.builder()
                                .provider(provider)
                                .title("Software Engineer Intern")
                                .description("Write code")
                                .status("active")
                                .workMode("remote")
                                .stipendMin(0)
                                .stipendMax(10000)
                                .applicationDeadline(LocalDate.now().plusDays(30))
                                .maxApplicants(10)
                                .build();
                internship = internshipRepository.save(internship);
                internshipId = internship.getId();
        }

        @Test
        void shouldCompleteFullApplicationFlow() {
                // 1. Apply
                ApplyRequest applyRequest = new ApplyRequest("My awesome cover letter");
                ApplicationResponse response = applicationService.apply(studentUserId, internshipId, applyRequest);

                assertThat(response.id()).isNotNull();
                assertThat(response.status()).isEqualTo(ApplicationStatus.APPLIED);
                assertThat(response.coverNote()).isEqualTo("My awesome cover letter");

                // Verify Repository
                assertThat(applicationRepository.count()).isEqualTo(1);
                Application app = applicationRepository.findById(response.id()).orElseThrow();
                assertThat(app.getStatus()).isEqualTo(ApplicationStatus.APPLIED);
                assertThat(app.getStatusHistory()).contains("Initial Application");

                // Verify Event Published (Async)
                await().atMost(10, TimeUnit.SECONDS).untilAsserted(() -> {
                        verify(eventPublisher)
                                        .publish(argThat((ApplicationEvent evt) -> evt.applicationId()
                                                        .equals(response.id()) &&
                                                        evt.eventType() == ApplicationEvent.Type.APPLICATION_CREATED));
                });

                // 2. Provider Updates Status
                UpdateApplicationStatusRequest updateRequest = new UpdateApplicationStatusRequest(
                                ApplicationStatus.SHORTLISTED);
                ApplicationResponse updatedResponse = applicationService.updateStatus(providerUserId, response.id(),
                                updateRequest);

                assertThat(updatedResponse.status()).isEqualTo(ApplicationStatus.SHORTLISTED);
                app = applicationRepository.findById(response.id()).orElseThrow();
                assertThat(app.getStatus()).isEqualTo(ApplicationStatus.SHORTLISTED);
                assertThat(app.getStatusHistory()).contains("SHORTLISTED");

                // Verify Event Published
                await().atMost(10, TimeUnit.SECONDS).untilAsserted(() -> {
                        verify(eventPublisher)
                                        .publish(argThat((ApplicationEvent evt) -> evt.applicationId()
                                                        .equals(response.id()) &&
                                                        evt.eventType() == ApplicationEvent.Type.STATUS_CHANGED &&
                                                        evt.newStatus() == ApplicationStatus.SHORTLISTED));
                });

                // 3. Withdraw
                applicationService.withdraw(studentUserId, internshipId);
                app = applicationRepository.findById(response.id()).orElseThrow();
                assertThat(app.getStatus()).isEqualTo(ApplicationStatus.WITHDRAWN);

                // 4. Try to re-apply (Should fail)
                assertThatThrownBy(() -> applicationService.apply(studentUserId, internshipId, applyRequest))
                                .isInstanceOf(IllegalStateException.class)
                                .hasMessageContaining("withdrawn");

                // 5. Try to update status as non-owner (Should fail)
                // Create another provider
                User otherUser = userRepository.save(User.builder()
                                .email("other@ex.com")
                                .passwordHash("pass")
                                .roles(java.util.Set.of(providerRole))
                                .fullName("Other")
                                .isActive(true)
                                .emailVerified(true)
                                .build());

                assertThatThrownBy(
                                () -> applicationService.updateStatus(otherUser.getId(), response.id(), updateRequest))
                                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        }
}
