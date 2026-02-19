package ai.nextintern.service;

import ai.nextintern.dto.StudentProfileResponse;
import ai.nextintern.dto.UpdateProfileRequest;
import ai.nextintern.entity.*;
import ai.nextintern.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class StudentProfileService {

    private final StudentProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;

    public StudentProfileService(StudentProfileRepository profileRepository,
            UserRepository userRepository,
            SkillRepository skillRepository) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
        this.skillRepository = skillRepository;
    }

    @Transactional(readOnly = true)
    public StudentProfileResponse getProfile(UUID userId) {
        StudentProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new NoSuchElementException("Profile not found"));
        User user = profile.getUser();
        return toResponse(profile, user);
    }

    @Transactional
    public StudentProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        StudentProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new NoSuchElementException("Profile not found"));
        User user = profile.getUser();

        // Update User fields
        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(ai.nextintern.security.SanitizationUtils.strict(request.fullName()));
            userRepository.save(user);
        }

        // Update Profile fields
        if (request.educationLevel() != null)
            profile.setEducationLevel(ai.nextintern.security.SanitizationUtils.strict(request.educationLevel()));
        if (request.university() != null)
            profile.setUniversity(ai.nextintern.security.SanitizationUtils.strict(request.university()));
        // graduationYear removed from request in favor of simpler MVP
        if (request.locationCity() != null)
            profile.setLocationCity(ai.nextintern.security.SanitizationUtils.strict(request.locationCity()));
        if (request.locationState() != null)
            profile.setLocationState(ai.nextintern.security.SanitizationUtils.strict(request.locationState()));
        // locationCountry defaults to India, kept as is

        if (request.interests() != null) {
            String[] sanitizedInterests = request.interests().stream()
                    .map(ai.nextintern.security.SanitizationUtils::strict)
                    .toArray(String[]::new);
            profile.setInterests(sanitizedInterests);
        }

        if (request.resumeUrl() != null)
            profile.setResumeUrl(ai.nextintern.security.SanitizationUtils.strict(request.resumeUrl()));

        if (request.bio() != null)
            profile.setBio(ai.nextintern.security.SanitizationUtils.basicFormatting(request.bio()));

        // Skills updated via separate endpoint

        profileRepository.save(profile);
        return toResponse(profile, user);
    }

    @Transactional
    public void updateSkills(UUID userId, ai.nextintern.dto.UpdateStudentSkillsRequest request) {
        StudentProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new NoSuchElementException("Profile not found"));

        // Delete existing skills
        // Note: Repository must have deleteByStudentProfileId
        // We can also do it via the entity collection if orphanRemoval=true,
        // but explicit repository delete is often cleaner for batch replace.
        // However, since we defined the repository method, we'll try to use it.
        // Or better, use the entity collection to ensure Hibernate sync.

        profile.getSkills().clear();

        // Save to trigger delete of orphans?
        // Better to flush?
        // Let's stick to the user's plan: deleteByStudentProfileId
        // But to use deleteByStudentProfileId, we need the ID of the profile.
        // And we should clear the collection in memory too to avoid confusion.

        // Actually, for @OneToMany with orphanRemoval=true, clearing the list is
        // enough.
        // Let's rely on JPA standard behavior first.

        for (ai.nextintern.dto.UpdateStudentSkillsRequest.SkillUpdateDTO dto : request.getSkills()) {
            Skill skill = skillRepository.findById(dto.getSkillId())
                    .orElseThrow(() -> new NoSuchElementException("Skill not found: " + dto.getSkillId()));

            StudentSkill ss = StudentSkill.builder()
                    .studentProfile(profile)
                    .skill(skill)
                    .proficiency(dto.getProficiency().shortValue())
                    .build();

            profile.getSkills().add(ss);
        }

        profileRepository.save(profile);
    }

    private StudentProfileResponse toResponse(StudentProfile profile, User user) {
        List<StudentProfileResponse.SkillInfo> skillInfos = profile.getSkills().stream()
                .map(ss -> new StudentProfileResponse.SkillInfo(
                        ss.getSkill().getId(),
                        ss.getSkill().getName(),
                        ss.getSkill().getCategory(),
                        ss.getProficiency()))
                .collect(Collectors.toList());

        return new StudentProfileResponse(
                profile.getId(),
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                profile.getEducationLevel(),
                profile.getUniversity(),
                profile.getGraduationYear(),
                profile.getLocationCity(),
                profile.getLocationState(),
                profile.getLocationCountry(),
                profile.getInterests() != null ? Arrays.asList(profile.getInterests()) : List.of(),
                profile.getBio(),
                skillInfos,
                computeCompleteness(profile));
    }

    /**
     * Computed at read time, not stored (v3 simplification S8).
     * Formula: (has_education + has_skills + has_location + has_interests +
     * has_bio) * 20 = 0-100
     */
    private int computeCompleteness(StudentProfile p) {
        int score = 0;
        if (p.getEducationLevel() != null && !p.getEducationLevel().isBlank())
            score += 20;
        if (p.getSkills() != null && !p.getSkills().isEmpty())
            score += 20;
        if (p.getLocationCity() != null && !p.getLocationCity().isBlank())
            score += 20;
        if (p.getInterests() != null && p.getInterests().length > 0)
            score += 20;
        if (p.getBio() != null && !p.getBio().isBlank())
            score += 20;
        return score;
    }
}
