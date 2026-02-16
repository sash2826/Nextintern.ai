package ai.nextintern.service;

import ai.nextintern.dto.*;
import ai.nextintern.entity.*;
import ai.nextintern.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class InternshipService {

    private static final int MAX_PAGE_SIZE = 50;

    private final InternshipRepository internshipRepository;
    private final ProviderRepository providerRepository;
    private final SkillRepository skillRepository;

    public InternshipService(InternshipRepository internshipRepository,
            ProviderRepository providerRepository,
            SkillRepository skillRepository) {
        this.internshipRepository = internshipRepository;
        this.providerRepository = providerRepository;
        this.skillRepository = skillRepository;
    }

    @Transactional
    public InternshipResponse create(UUID userId, CreateInternshipRequest request) {
        Provider provider = providerRepository.findByUserId(userId)
                .orElseThrow(() -> new NoSuchElementException("Provider profile not found"));

        Internship internship = Internship.builder()
                .provider(provider)
                .title(request.title())
                .description(request.description())
                .category(request.category())
                .stipendMin(request.stipendMin())
                .stipendMax(request.stipendMax())
                .locationCity(request.locationCity())
                .locationState(request.locationState())
                .locationCountry(request.locationCountry() != null ? request.locationCountry() : "India")
                .workMode(request.workMode())
                .eligibility(request.eligibility())
                .durationWeeks(request.durationWeeks())
                .startDate(request.startDate())
                .applicationDeadline(request.applicationDeadline())
                .maxApplicants(request.maxApplicants())
                .status("active")
                .build();

        // Attach skills
        if (request.skills() != null) {
            for (CreateInternshipRequest.SkillInput si : request.skills()) {
                Skill skill = skillRepository.findByNameIgnoreCase(si.name())
                        .orElseGet(() -> skillRepository.save(Skill.builder().name(si.name()).build()));
                InternshipSkill is = InternshipSkill.builder()
                        .internship(internship)
                        .skill(skill)
                        .importance(si.importance())
                        .build();
                internship.getSkills().add(is);
            }
        }

        internshipRepository.save(internship);
        return toResponse(internship, 0);
    }

    @Transactional(readOnly = true)
    public InternshipResponse getById(UUID id) {
        Internship internship = internshipRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Internship not found"));
        long count = internshipRepository.countActiveApplications(id);
        return toResponse(internship, count);
    }

    @Transactional(readOnly = true)
    public Page<InternshipResponse> search(String category, String workMode, String state,
            int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE));
        return internshipRepository
                .searchActive(category, workMode, state, pageable)
                .map(i -> toResponse(i, internshipRepository.countActiveApplications(i.getId())));
    }

    @Transactional(readOnly = true)
    public Page<InternshipResponse> getByProvider(UUID userId, int page, int size) {
        Provider provider = providerRepository.findByUserId(userId)
                .orElseThrow(() -> new NoSuchElementException("Provider profile not found"));
        Pageable pageable = PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE));
        return internshipRepository
                .findByProviderId(provider.getId(), pageable)
                .map(i -> toResponse(i, internshipRepository.countActiveApplications(i.getId())));
    }

    private InternshipResponse toResponse(Internship i, long applicantCount) {
        var providerInfo = new InternshipResponse.ProviderInfo(
                i.getProvider().getId(),
                i.getProvider().getCompanyName(),
                i.getProvider().getLogoUrl(),
                i.getProvider().getVerified());

        var skills = i.getSkills().stream()
                .map(is -> new InternshipResponse.SkillInfo(is.getSkill().getName(), is.getImportance()))
                .collect(Collectors.toList());

        return new InternshipResponse(
                i.getId(), i.getTitle(), i.getDescription(), i.getCategory(),
                i.getStipendMin(), i.getStipendMax(),
                i.getLocationCity(), i.getLocationState(), i.getLocationCountry(),
                i.getWorkMode(), i.getEligibility(), i.getDurationWeeks(),
                i.getStartDate(), i.getApplicationDeadline(), i.getMaxApplicants(),
                applicantCount, i.getStatus(), providerInfo, skills,
                i.getCreatedAt() != null ? i.getCreatedAt().toString() : null);
    }
}
