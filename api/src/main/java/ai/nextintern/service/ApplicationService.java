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
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final InternshipRepository internshipRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final ProviderRepository providerRepository;

    public ApplicationService(ApplicationRepository applicationRepository,
            InternshipRepository internshipRepository,
            StudentProfileRepository studentProfileRepository,
            ProviderRepository providerRepository) {
        this.applicationRepository = applicationRepository;
        this.internshipRepository = internshipRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.providerRepository = providerRepository;
    }

    @Transactional
    public ApplicationResponse apply(UUID userId, UUID internshipId, ApplyRequest request) {
        StudentProfile student = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NoSuchElementException("Please create a student profile first"));

        Internship internship = internshipRepository.findById(internshipId)
                .orElseThrow(() -> new NoSuchElementException("Internship not found"));

        if (!"active".equals(internship.getStatus())) {
            throw new IllegalStateException("Internship is not active");
        }

        // Check if already applied (or withdrawn)
        Optional<Application> existing = applicationRepository.findByStudentIdAndInternshipId(student.getId(),
                internshipId);
        if (existing.isPresent()) {
            Application app = existing.get();
            if ("withdrawn".equals(app.getStatus())) {
                // Re-apply
                app.setStatus("applied"); // Reset status
                app.setAppliedAt(Instant.now());
                if (request.coverNote() != null) {
                    app.setCoverNote(request.coverNote());
                }
                return toResponse(applicationRepository.save(app));
            } else {
                throw new IllegalStateException("You have already applied to this internship");
            }
        }

        // Check capacity
        long count = internshipRepository.countActiveApplications(internshipId);
        if (internship.getMaxApplicants() != null && count >= internship.getMaxApplicants()) {
            throw new IllegalStateException("This internship has reached its application limit");
        }

        Application application = Application.builder()
                .student(student)
                .internship(internship)
                .status("applied")
                .coverNote(request.coverNote())
                .appliedAt(Instant.now())
                .statusHistory("[]")
                .build();

        return toResponse(applicationRepository.save(application));
    }

    @Transactional
    public void withdraw(UUID userId, UUID internshipId) {
        StudentProfile student = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NoSuchElementException("Student profile not found"));

        Application app = applicationRepository.findByStudentIdAndInternshipId(student.getId(), internshipId)
                .orElseThrow(() -> new NoSuchElementException("Application not found"));

        if ("withdrawn".equals(app.getStatus()) || "rejected".equals(app.getStatus())) {
            return; // Idempotent
        }

        app.setStatus("withdrawn");
        applicationRepository.save(app);
    }

    @Transactional
    public ApplicationResponse updateStatus(UUID providerUserId, UUID applicationId,
            UpdateApplicationStatusRequest request) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new NoSuchElementException("Application not found"));

        // Verify ownership
        if (!application.getInternship().getProvider().getUserId().equals(providerUserId)) {
            throw new AccessDeniedException("You do not have permission to update this application");
        }

        application.setStatus(request.status());
        // Ideally append to statusHistory JSON here, skipping for MVP simplicity

        return toResponse(applicationRepository.save(application));
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

        if (!internship.getProvider().getUserId().equals(providerUserId)) {
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
