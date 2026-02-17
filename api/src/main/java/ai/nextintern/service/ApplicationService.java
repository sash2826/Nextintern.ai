package ai.nextintern.service;

import ai.nextintern.dto.ApplicationResponse;
import ai.nextintern.dto.ApplyRequest;
import ai.nextintern.dto.UpdateApplicationStatusRequest;
import ai.nextintern.entity.Application;
import ai.nextintern.entity.Internship;
import ai.nextintern.entity.StudentProfile;
import ai.nextintern.repository.ApplicationRepository;
import ai.nextintern.repository.InternshipRepository;
import ai.nextintern.repository.ProviderRepository;
import ai.nextintern.repository.StudentProfileRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import ai.nextintern.entity.ApplicationStatus;
import ai.nextintern.event.EventPublisher;
import ai.nextintern.dto.ApplicationEvent;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.time.LocalDate;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
@Slf4j
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final InternshipRepository internshipRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final ProviderRepository providerRepository; // Kept for consistency if needed later
    private final EventPublisher eventPublisher;

    public ApplicationService(ApplicationRepository applicationRepository,
            InternshipRepository internshipRepository,
            StudentProfileRepository studentProfileRepository,
            ProviderRepository providerRepository,
            EventPublisher eventPublisher) {
        this.applicationRepository = applicationRepository;
        this.internshipRepository = internshipRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.providerRepository = providerRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public ApplicationResponse apply(UUID userId, UUID internshipId, ApplyRequest request) {
        StudentProfile student = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NoSuchElementException("Please create a student profile first"));

        Internship internship = internshipRepository.findById(internshipId)
                .orElseThrow(() -> new NoSuchElementException("Internship not found"));

        // 1. Validate Active
        if (!"active".equalsIgnoreCase(internship.getStatus())) {
            throw new IllegalStateException("Internship is not active");
        }

        // 2. Validate Deadline
        if (internship.getApplicationDeadline() != null
                && internship.getApplicationDeadline().isBefore(LocalDate.now())) {
            throw new IllegalStateException("Application deadline has passed");
        }

        // 3. Validate Capacity
        if (internship.getMaxApplicants() != null) {
            long currentCount = internshipRepository.countActiveApplications(internshipId);
            if (currentCount >= internship.getMaxApplicants()) {
                throw new IllegalStateException("This internship has reached its application limit");
            }
        }

        // 4. Duplicate Check
        if (applicationRepository.existsByStudentIdAndInternshipId(student.getId(), internshipId)) {
            // Check if withdrawn?
            Optional<Application> existing = applicationRepository.findByStudentIdAndInternshipId(student.getId(),
                    internshipId);
            if (existing.isPresent()) {
                Application app = existing.get();
                if (app.getStatus() == ApplicationStatus.WITHDRAWN) {
                    // Re-apply logic if needed, OR throw error "Already applied (withdrawn)"
                    // Plan says "Terminal: WITHDRAWN... No reverting allowed". So we throw
                    // exception.
                    throw new IllegalStateException("You have withdrawn from this internship and cannot re-apply.");
                }
            }
            throw new IllegalStateException("You have already applied to this internship");
        }

        // 5. Create Application
        Application application = Application.builder()
                .student(student)
                .internship(internship)
                .status(ApplicationStatus.APPLIED) // Strict Enum
                .coverNote(request.coverNote())
                .appliedAt(Instant.now())
                .statusHistory(createInitialHistory())
                .build();

        Application savedApp = applicationRepository.save(application);
        log.info("Student {} applied to internship {}", student.getId(), internshipId);

        // 6. Publish Event
        String traceId = UUID.randomUUID().toString(); // Or get from MDC
        eventPublisher.publish(new ApplicationEvent(
                savedApp.getId(),
                internshipId,
                student.getId(),
                ApplicationEvent.Type.APPLICATION_CREATED,
                ApplicationStatus.APPLIED,
                Instant.now(),
                traceId));

        return toResponse(savedApp);
    }

    @Transactional
    public void withdraw(UUID userId, UUID internshipId) {
        StudentProfile student = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NoSuchElementException("Student profile not found"));

        Application app = applicationRepository.findByStudentIdAndInternshipId(student.getId(), internshipId)
                .orElseThrow(() -> new NoSuchElementException("Application not found"));

        if (app.getStatus().isTerminal()) {
            return; // Already terminal
        }

        updateStatusInternal(app, ApplicationStatus.WITHDRAWN, "Student withdrew application");
    }

    @Transactional
    public ApplicationResponse updateStatus(UUID providerUserId, UUID applicationId,
            UpdateApplicationStatusRequest request) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new NoSuchElementException("Application not found"));

        // Verify ownership
        // Verify ownership
        if (application.getInternship() == null ||
                application.getInternship().getProvider() == null ||
                application.getInternship().getProvider().getUser() == null ||
                !application.getInternship().getProvider().getUser().getId().equals(providerUserId)) {
            throw new AccessDeniedException("You do not have permission to update this application");
        }

        ApplicationStatus newStatus = request.status();

        // Validate Transition
        if (!application.getStatus().canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    "Invalid status transition from " + application.getStatus() + " to " + newStatus);
        }

        updateStatusInternal(application, newStatus, "Provider updated status");
        return toResponse(application);
    }

    private void updateStatusInternal(Application app, ApplicationStatus newStatus, String reason) {
        ApplicationStatus oldStatus = app.getStatus();
        app.setStatus(newStatus);

        // Append history (simple string append or JSON lib; for MVP string
        // manipulation/placeholder)
        // ideally use Jackson to parse, add, serialize. For simplicity:
        String entry = String.format("{\"status\": \"%s\", \"timestamp\": \"%s\", \"reason\": \"%s\"}", newStatus,
                Instant.now(), reason);
        // This is a rough way to append to JSON array string "[]" -> "[{...}]" or
        // "[{...},{...}]"
        String history = app.getStatusHistory();
        if (history == null || history.length() < 2)
            history = "[]";

        if (history.equals("[]")) {
            app.setStatusHistory("[" + entry + "]");
        } else {
            app.setStatusHistory(history.substring(0, history.length() - 1) + "," + entry + "]");
        }

        Application savedApp = applicationRepository.save(app);

        // Publish Event
        eventPublisher.publish(new ApplicationEvent(
                savedApp.getId(),
                savedApp.getInternship().getId(),
                savedApp.getStudent().getId(),
                ApplicationEvent.Type.STATUS_CHANGED,
                newStatus,
                Instant.now(),
                UUID.randomUUID().toString()));

        log.info("Application {} status changed from {} to {}", app.getId(), oldStatus, newStatus);
    }

    private String createInitialHistory() {
        return String.format("[{\"status\": \"APPLIED\", \"timestamp\": \"%s\", \"reason\": \"Initial Application\"}]",
                Instant.now());
    }

    public Page<ApplicationResponse> getMyApplications(UUID userId, Pageable pageable) {
        StudentProfile student = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NoSuchElementException("Student profile not found"));

        return applicationRepository.findByStudentId(student.getId(), pageable)
                .map(this::toResponse);
    }

    public Page<ApplicationResponse> getApplicationsForInternship(UUID providerUserId, UUID internshipId,
            Pageable pageable) {
        Internship internship = internshipRepository.findById(internshipId)
                .orElseThrow(() -> new NoSuchElementException("Internship not found"));

        if (internship.getProvider() == null ||
                internship.getProvider().getUser() == null ||
                !internship.getProvider().getUser().getId().equals(providerUserId)) {
            throw new AccessDeniedException("You do not own this internship");
        }

        return applicationRepository.findByInternshipId(internshipId, pageable)
                .map(this::toResponse);
    }

    private ApplicationResponse toResponse(Application app) {
        var student = app.getStudent();
        var user = student.getUser();

        var applicantInfo = new ApplicationResponse.ApplicantInfo(
                student.getId(),
                user != null ? user.getFullName() : "Unknown",
                user != null ? user.getEmail() : "",
                student.getResumeUrl(),
                student.getEducationLevel(),
                student.getUniversity());

        var internshipInfo = new ApplicationResponse.InternshipInfo(
                app.getInternship().getId(),
                app.getInternship().getTitle(),
                app.getInternship().getProvider().getCompanyName());

        return new ApplicationResponse(
                app.getId(),
                app.getStatus(),
                app.getCoverNote(),
                app.getAppliedAt() != null ? app.getAppliedAt().toString() : null,
                applicantInfo,
                internshipInfo);
    }
}
