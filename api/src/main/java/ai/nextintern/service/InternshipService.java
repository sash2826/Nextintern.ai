package ai.nextintern.service;

import ai.nextintern.dto.*;
import ai.nextintern.entity.*;
import ai.nextintern.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
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
        private final SearchService searchService;

        public InternshipService(InternshipRepository internshipRepository,
                        ProviderRepository providerRepository,
                        SkillRepository skillRepository,
                        SearchService searchService) {
                this.internshipRepository = internshipRepository;
                this.providerRepository = providerRepository;
                this.skillRepository = skillRepository;
                this.searchService = searchService;
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
                                .locationCountry(
                                                request.locationCountry() != null ? request.locationCountry() : "India")
                                .workMode(request.workMode())
                                .eligibility(request.eligibility())
                                .durationWeeks(request.durationWeeks())
                                .startDate(request.startDate())
                                .applicationDeadline(request.applicationDeadline())
                                .maxApplicants(request.maxApplicants())
                                .status("active")
                                .build();

                attachSkills(internship, request.skills());

                internship = internshipRepository.save(internship);
                searchService.indexInternship(internship);
                return toResponse(internship, 0);
        }

        @Transactional
        public InternshipResponse update(UUID id, UUID userId, UpdateInternshipRequest request) {
                Internship internship = internshipRepository.findById(id)
                                .orElseThrow(() -> new NoSuchElementException("Internship not found"));

                if (!internship.getProvider().getUser().getId().equals(userId)) {
                        throw new org.springframework.security.access.AccessDeniedException(
                                        "You are not authorized to update this internship");
                }

                if (request.title() != null)
                        internship.setTitle(request.title());
                if (request.description() != null)
                        internship.setDescription(request.description());
                if (request.category() != null)
                        internship.setCategory(request.category());
                if (request.stipendMin() != null)
                        internship.setStipendMin(request.stipendMin());
                if (request.stipendMax() != null)
                        internship.setStipendMax(request.stipendMax());
                if (request.locationCity() != null)
                        internship.setLocationCity(request.locationCity());
                if (request.locationState() != null)
                        internship.setLocationState(request.locationState());
                if (request.locationCountry() != null)
                        internship.setLocationCountry(request.locationCountry());
                if (request.workMode() != null)
                        internship.setWorkMode(request.workMode());
                if (request.eligibility() != null)
                        internship.setEligibility(request.eligibility());
                if (request.durationWeeks() != null)
                        internship.setDurationWeeks(request.durationWeeks());
                if (request.startDate() != null)
                        internship.setStartDate(request.startDate());
                if (request.applicationDeadline() != null)
                        internship.setApplicationDeadline(request.applicationDeadline());
                if (request.maxApplicants() != null)
                        internship.setMaxApplicants(request.maxApplicants());

                if (request.skills() != null) {
                        internship.getSkills().clear();
                        attachSkills(internship, request.skills());
                }

                internship = internshipRepository.save(internship);
                searchService.indexInternship(internship);
                long count = internshipRepository.countActiveApplications(id);
                return toResponse(internship, count);
        }

        @Transactional
        public void delete(UUID id, UUID userId) {
                Internship internship = internshipRepository.findById(id)
                                .orElseThrow(() -> new NoSuchElementException("Internship not found"));

                if (!internship.getProvider().getUser().getId().equals(userId)) {
                        throw new org.springframework.security.access.AccessDeniedException(
                                        "You are not authorized to delete this internship");
                }
                internship.setStatus("archived");
                internshipRepository.save(internship);
                searchService.deleteInternship(id);
        }

        @Transactional(readOnly = true)
        public InternshipResponse getById(UUID id) {
                Internship internship = internshipRepository.findById(id)
                                .orElseThrow(() -> new NoSuchElementException("Internship not found"));
                long count = internshipRepository.countActiveApplications(id);
                return toResponse(internship, count);
        }

        @Transactional(readOnly = true)
        public Page<InternshipResponse> search(
                        String query,
                        String category,
                        String workMode,
                        String state,
                        int page,
                        int size) {

                if (size < 1)
                        size = 10;
                if (size > MAX_PAGE_SIZE)
                        size = MAX_PAGE_SIZE;

                SearchResult result = searchService.searchInternships(
                                query, category, workMode, state, page, size);

                if (result.ids().isEmpty()) {
                        return Page.<InternshipResponse>empty();
                }

                List<Internship> internships = internshipRepository.findAllById(result.ids());

                // Preserve OpenSearch order
                Map<UUID, Internship> map = internships.stream()
                                .collect(Collectors.toMap(Internship::getId, i -> i));

                List<Internship> ordered = result.ids().stream()
                                .map(map::get)
                                .filter(Objects::nonNull)
                                .collect(Collectors.toList());

                // Batch fetch counts
                List<UUID> ids = result.ids();
                Map<UUID, Long> counts = ids.isEmpty() ? Collections.emptyMap()
                                : internshipRepository.countActiveApplicationsByIds(ids).stream()
                                                .collect(Collectors.toMap(
                                                                row -> (UUID) row[0],
                                                                row -> (Long) row[1]));

                List<InternshipResponse> responseList = ordered.stream()
                                .map(i -> toResponse(i, counts.getOrDefault(i.getId(), 0L)))
                                .collect(Collectors.toList());

                return new PageImpl(responseList, PageRequest.of(page, size), result.total());

        }

        @Transactional(readOnly = true)
        public Page<InternshipResponse> getByProvider(UUID userId, int page, int size) {
                Provider provider = providerRepository.findByUserId(userId)
                                .orElseThrow(() -> new NoSuchElementException("Provider profile not found"));
                Pageable pageable = PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE));
                Page<Internship> pageResult = internshipRepository
                                .findByProviderId(provider.getId(), pageable);

                List<Internship> internships = pageResult.getContent();
                List<UUID> ids = internships.stream().map(Internship::getId).collect(Collectors.toList());

                Map<UUID, Long> counts = internshipRepository.countActiveApplicationsByIds(ids).stream()
                                .collect(Collectors.toMap(
                                                row -> (UUID) row[0],
                                                row -> (Long) row[1]));

                return pageResult.map(i -> toResponse(i, counts.getOrDefault(i.getId(), 0L)));
        }

        @Transactional
        public void reindexAll() {
                List<Internship> all = internshipRepository.findAll();
                for (Internship internship : all) {
                        searchService.indexInternship(internship);
                }
        }

        private void attachSkills(Internship internship, List<CreateInternshipRequest.SkillInput> skillsInput) {
                if (skillsInput != null) {
                        if (internship.getSkills() == null) {
                                // Should invoke getter if lazy loaded, but here we are constructing or it's
                                // fetched
                        }
                        // Use existing collection if initialized
                        for (CreateInternshipRequest.SkillInput si : skillsInput) {
                                Skill skill;
                                try {
                                        skill = skillRepository.findByNameIgnoreCase(si.name())
                                                        .orElseGet(() -> skillRepository
                                                                        .save(Skill.builder().name(si.name()).build()));
                                } catch (org.springframework.dao.DataIntegrityViolationException
                                                | org.hibernate.exception.ConstraintViolationException e) {
                                        // Handle concurrent insert race condition
                                        skill = skillRepository.findByNameIgnoreCase(si.name())
                                                        .orElseThrow(() -> new RuntimeException(
                                                                        "Skill should exist but not found after constraint violation",
                                                                        e));
                                }
                                InternshipSkill is = InternshipSkill.builder()
                                                .internship(internship)
                                                .skill(skill)
                                                .importance(si.importance())
                                                .build();
                                internship.getSkills().add(is);
                        }
                }
        }

        private InternshipResponse toResponse(Internship i, long applicantCount) {
                var providerInfo = new InternshipResponse.ProviderInfo(
                                i.getProvider().getId(),
                                i.getProvider().getCompanyName(),
                                i.getProvider().getLogoUrl(),
                                i.getProvider().getVerified());

                var skills = i.getSkills().stream()
                                .map(is -> new InternshipResponse.SkillInfo(is.getSkill().getName(),
                                                is.getImportance()))
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
