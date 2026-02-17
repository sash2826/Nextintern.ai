package ai.nextintern.service;

import ai.nextintern.dto.InternshipResponse;
import ai.nextintern.entity.Internship;
import ai.nextintern.entity.SavedInternship;
import ai.nextintern.entity.StudentProfile;
import ai.nextintern.repository.InternshipRepository;
import ai.nextintern.repository.SavedInternshipRepository;
import ai.nextintern.repository.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SavedInternshipService {

        private final SavedInternshipRepository savedInternshipRepository;
        private final StudentProfileRepository studentProfileRepository;
        private final InternshipRepository internshipRepository;

        @Transactional
        public boolean toggleSave(UUID userId, UUID internshipId) {
                StudentProfile student = studentProfileRepository.findByUserId(userId)
                                .orElseThrow(() -> new NoSuchElementException("Student profile not found"));

                if (savedInternshipRepository.existsByStudentIdAndInternshipId(student.getId(), internshipId)) {
                        log.info("Unsaving internship {} for student {}", internshipId, student.getId());
                        savedInternshipRepository.deleteByStudentIdAndInternshipId(student.getId(), internshipId);
                        return false; // Not saved anymore
                } else {
                        log.info("Saving internship {} for student {}", internshipId, student.getId());
                        Internship internship = internshipRepository.findById(internshipId)
                                        .orElseThrow(() -> new NoSuchElementException("Internship not found"));

                        SavedInternship saved = SavedInternship.builder()
                                        .student(student)
                                        .internship(internship)
                                        .savedAt(Instant.now())
                                        .build();
                        savedInternshipRepository.save(saved);
                        return true; // Saved
                }
        }

        public Page<InternshipResponse> getSavedInternships(UUID userId, Pageable pageable) {
                StudentProfile student = studentProfileRepository.findByUserId(userId)
                                .orElseThrow(() -> new NoSuchElementException("Student profile not found"));

                return savedInternshipRepository.findByStudentId(student.getId(), pageable)
                                .map(saved -> toInternshipResponse(saved.getInternship()));
        }

        private InternshipResponse toInternshipResponse(Internship internship) {
                long applicantCount = internshipRepository.countActiveApplications(internship.getId());

                InternshipResponse.ProviderInfo providerInfo = new InternshipResponse.ProviderInfo(
                                internship.getProvider().getId(),
                                internship.getProvider().getCompanyName(),
                                internship.getProvider().getLogoUrl(),
                                internship.getProvider().getVerified());

                var skills = internship.getSkills() != null ? internship.getSkills().stream()
                                .map(is -> new InternshipResponse.SkillInfo(is.getSkill().getName(),
                                                is.getImportance()))
                                .toList() : java.util.Collections.<InternshipResponse.SkillInfo>emptyList();

                return new InternshipResponse(
                                internship.getId(),
                                internship.getTitle(),
                                internship.getDescription(),
                                internship.getCategory(),
                                internship.getStipendMin(),
                                internship.getStipendMax(),
                                internship.getLocationCity(),
                                internship.getLocationState(),
                                internship.getLocationCountry(),
                                internship.getWorkMode(),
                                internship.getEligibility(),
                                internship.getDurationWeeks(),
                                internship.getStartDate(),
                                internship.getApplicationDeadline(),
                                internship.getMaxApplicants(),
                                applicantCount,
                                internship.getStatus(),
                                providerInfo,
                                skills,
                                internship.getCreatedAt() != null ? internship.getCreatedAt().toString() : null);
        }
}
